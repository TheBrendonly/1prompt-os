import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const POLLING_INTERVAL = 3000; // 3 seconds
const MAX_POLLING_DURATION = 600000; // 10 minutes

export interface AIGenerationJobOptions {
  clientId?: string;
  jobType?: string;
}

export interface AIGenerationJobResult<T = any> {
  jobId: string | null;
  isPolling: boolean;
  result: T | null;
  error: string | null;
  startJob: (edgeFunctionName: string, body: Record<string, any>) => Promise<void>;
  reset: () => void;
}

export function useAIGenerationJob<T = any>(options?: AIGenerationJobOptions): AIGenerationJobResult<T> {
  const [jobId, setJobId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resolvedRef = useRef(false);

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const setupPollingAndRealtime = useCallback((id: string, startTime: number, onCompleted?: (r: T) => void, onFailed?: (e: string) => void) => {
    const handleCompleted = (row: any) => {
      if (resolvedRef.current) return;
      resolvedRef.current = true;
      cleanup();
      setIsPolling(false);
      setResult(row.result as T);
      onCompleted?.(row.result as T);
    };

    const handleFailed = (row: any) => {
      if (resolvedRef.current) return;
      resolvedRef.current = true;
      cleanup();
      setIsPolling(false);
      const errMsg = row.error_message || 'AI generation failed';
      setError(errMsg);
      onFailed?.(errMsg);
    };

    const pollOnce = async () => {
      if (resolvedRef.current) return;

      if (Date.now() - startTime > MAX_POLLING_DURATION) {
        if (resolvedRef.current) return;
        resolvedRef.current = true;
        cleanup();
        setIsPolling(false);
        const err = 'AI generation timed out after 10 minutes. Please try again.';
        setError(err);
        onFailed?.(err);
        return;
      }

      try {
        const { data: jobRow } = await supabase
          .from('ai_generation_jobs' as any)
          .select('status, result, error_message')
          .eq('id', id)
          .single();

        console.log('[AI Job Poll]', id, jobRow ? (jobRow as any).status : 'null response', (jobRow as any)?.result ? 'has result' : 'no result');

        if (jobRow) {
          const row = jobRow as any;
          if (row.status === 'completed') handleCompleted(row);
          else if (row.status === 'failed') handleFailed(row);
          else if (row.error_message) handleFailed(row);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    pollOnce();
    pollingRef.current = setInterval(pollOnce, POLLING_INTERVAL);

    const channel = supabase
      .channel(`ai-job-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ai_generation_jobs',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (row.status === 'completed') handleCompleted(row);
          else if (row.status === 'failed') handleFailed(row);
          else if (row.error_message) handleFailed(row);
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, [cleanup]);

  // On mount: check for already-completed or in-progress jobs
  useEffect(() => {
    if (!options?.clientId || !options?.jobType) return;

    const checkExisting = async () => {
      try {
        const { data } = await supabase
          .from('ai_generation_jobs' as any)
          .select('id, status, result, error_message, created_at')
          .eq('client_id', options.clientId!)
          .eq('job_type', options.jobType!)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          const row = data as any;
          if (row.status === 'completed' && row.result) {
            setJobId(row.id);
            setResult(row.result as T);
          } else if (row.status === 'failed') {
            setJobId(row.id);
            setError(row.error_message || 'AI generation failed');
          } else if (row.status === 'pending' || row.status === 'running') {
            const createdAt = new Date(row.created_at).getTime();
            // Only resume if the job was created less than 10 min ago
            if (Date.now() - createdAt < MAX_POLLING_DURATION) {
              setJobId(row.id);
              setIsPolling(true);
              resolvedRef.current = false;
              setupPollingAndRealtime(row.id, createdAt);
            }
          }
        }
      } catch {
        // No existing job found
      }
    };

    checkExisting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options?.clientId, options?.jobType]);

  const reset = useCallback(() => {
    cleanup();
    resolvedRef.current = false;
    setJobId(null);
    setIsPolling(false);
    setResult(null);
    setError(null);
  }, [cleanup]);

  const startJob = useCallback(async (edgeFunctionName: string, body: Record<string, any>): Promise<void> => {
    reset();

    const { data, error: fnError } = await supabase.functions.invoke(edgeFunctionName, { body });

    if (fnError) throw new Error(fnError.message || 'Failed to start AI job');
    if (data?.error) throw new Error(data.error);

    const id = data?.job_id;
    if (!id) throw new Error('No job_id returned from edge function');

    setJobId(id);
    setIsPolling(true);
    resolvedRef.current = false;

    setupPollingAndRealtime(id, Date.now());
  }, [reset, setupPollingAndRealtime]);

  return { jobId, isPolling, result, error, startJob, reset };
}
