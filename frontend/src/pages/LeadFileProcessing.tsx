import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { StatusTag } from '@/components/StatusTag';
import SavingOverlay from '@/components/SavingOverlay';
import { CheckCircle, Download } from '@/components/icons';
import { toast } from 'sonner';

type LeadFileJobStatus = 'pending' | 'running' | 'completed' | 'failed';

interface LeadFileJobResult {
  operation?: 'import' | 'export';
  fileName?: string;
  totalRows?: number;
  processedRows?: number;
  insertedCount?: number;
  updatedCount?: number;
  skippedCount?: number;
  progressPercent?: number;
  stage?: string;
  csvBase64?: string;
}

interface LeadFileJob {
  id: string;
  status: LeadFileJobStatus;
  job_type: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  input_payload: {
    fileName?: string;
    totalRows?: number;
    operation?: 'import' | 'export';
    clientRequestId?: string;
  } | null;
  result: LeadFileJobResult | null;
}

const LEAD_FILE_JOB_TYPES = ['lead-file-import', 'lead-file-export'];

const getStatusVariant = (status: LeadFileJobStatus) => {
  if (status === 'completed') return 'positive' as const;
  if (status === 'failed') return 'negative' as const;
  if (status === 'running') return 'warning' as const;
  return 'neutral' as const;
};

const getStatusLabel = (status: LeadFileJobStatus) => {
  if (status === 'running') return 'PROCESSING';
  if (status === 'pending') return 'QUEUED';
  if (status === 'completed') return 'COMPLETE';
  return 'FAILED';
};

const decodeBase64ToBlob = (base64: string) => {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: 'text/csv;charset=utf-8;' });
};

export default function LeadFileProcessing() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<LeadFileJob[]>([]);
  const [loading, setLoading] = useState(true);

  const awaitImportRequestId = searchParams.get('awaitImport');
  const [awaitingRequestId, setAwaitingRequestId] = useState<string | null>(awaitImportRequestId);
  const awaitStartRef = useRef(Date.now());

  useEffect(() => {
    if (!awaitImportRequestId) return;
    awaitStartRef.current = Date.now();
    setAwaitingRequestId(awaitImportRequestId);
  }, [awaitImportRequestId]);

  usePageHeader({
    title: 'LEADS',
    breadcrumbs: [
      { label: 'LEADS', onClick: () => navigate(`/client/${clientId}/leads`) },
      { label: 'FILE PROCESSING' },
    ],
  }, [clientId, navigate]);

  const fetchJobs = useCallback(async () => {
    if (!clientId) return [] as LeadFileJob[];

    const { data, error } = await (supabase.from('ai_generation_jobs') as any)
      .select('id, status, job_type, created_at, started_at, completed_at, error_message, input_payload, result')
      .eq('client_id', clientId)
      .in('job_type', LEAD_FILE_JOB_TYPES)
      .order('created_at', { ascending: false })
      .limit(25);

    if (error) {
      console.error('Failed to load file jobs:', error);
      toast.error('Failed to load file processing history');
      return [] as LeadFileJob[];
    }

    const fetched = (data || []) as LeadFileJob[];
    setJobs(fetched);
    setLoading(false);
    return fetched;
  }, [clientId]);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (!awaitingRequestId || !clientId) return;

    const clearAwaitingState = () => {
      setAwaitingRequestId(null);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('awaitImport');
        return next;
      }, { replace: true });
    };

    const interval = window.setInterval(async () => {
      const fetched = await fetchJobs();
      const matchingJob = fetched.find((job) => job.input_payload?.clientRequestId === awaitingRequestId);

      if (matchingJob) {
        clearAwaitingState();
        return;
      }

      if (Date.now() - awaitStartRef.current > 30000) {
        clearAwaitingState();
      }
    }, 500);

    return () => window.clearInterval(interval);
  }, [awaitingRequestId, clientId, fetchJobs, setSearchParams]);

  const hasActiveJobs = useMemo(
    () => jobs.some((job) => job.status === 'pending' || job.status === 'running'),
    [jobs],
  );

  useEffect(() => {
    if (!clientId || awaitingRequestId) return;

    const interval = window.setInterval(() => {
      void fetchJobs();
    }, hasActiveJobs ? 1500 : 8000);

    return () => window.clearInterval(interval);
  }, [clientId, fetchJobs, hasActiveJobs, awaitingRequestId]);

  const handleDownload = (job: LeadFileJob) => {
    const csvBase64 = job.result?.csvBase64;
    if (!csvBase64) {
      toast.error('This export is not ready yet');
      return;
    }

    const blob = decodeBase64ToBlob(csvBase64);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = job.result?.fileName || 'leads-export.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const isAwaitingOverlay = loading || Boolean(awaitingRequestId);

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden bg-background relative" style={{ scrollbarGutter: 'stable' as const }}>
      <SavingOverlay isVisible={isAwaitingOverlay} message="Importing leads..." variant="fixed" opaque />
      <div className="container mx-auto max-w-7xl flex min-h-full flex-col gap-4 pt-6 pb-6">
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <CheckCircle className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-lg font-medium">No files processed</h3>
              <p className="text-sm text-muted-foreground mt-1">Imports and exports will show up here with live progress.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="groove-border bg-card divide-y divide-border/50">
            {jobs.map((job) => {
              const isImport = (job.result?.operation || job.input_payload?.operation) === 'import' || job.job_type === 'lead-file-import';
              const progressPercent = Math.max(0, Math.min(100, job.result?.progressPercent ?? (job.status === 'completed' ? 100 : 0)));
              const totalRows = job.result?.totalRows ?? job.input_payload?.totalRows ?? 0;
              const processedRows = job.result?.processedRows ?? 0;
              const stage = job.result?.stage;
              const dateStr = new Date(job.created_at).toLocaleDateString();
              const isActive = job.status === 'pending' || job.status === 'running';

              return (
                <div key={job.id} className="px-4 py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-foreground font-medium field-text truncate">
                      {isImport ? 'CSV Import' : 'CSV Export'} — {totalRows.toLocaleString()} row{totalRows === 1 ? '' : 's'} — {dateStr}
                    </p>
                    {!isImport && job.status === 'completed' && job.result?.csvBase64 && (
                      <Button variant="outline" size="sm" onClick={() => handleDownload(job)}>
                        <Download className="w-4 h-4 mr-1.5" />
                        Download
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="field-text text-muted-foreground">
                      {processedRows.toLocaleString()} / {totalRows.toLocaleString()} processed
                      {isActive && stage ? ` — ${stage}` : ''}
                    </span>
                    <StatusTag variant={getStatusVariant(job.status)}>{getStatusLabel(job.status)}</StatusTag>
                  </div>

                  <Progress value={progressPercent} className="h-2" />

                  {isImport && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground field-text">
                      <span>{(job.result?.insertedCount || 0).toLocaleString()} imported</span>
                      <span>{(job.result?.updatedCount || 0).toLocaleString()} updated</span>
                      <span>{(job.result?.skippedCount || 0).toLocaleString()} skipped</span>
                    </div>
                  )}
                  {job.error_message && (
                    <p className="field-text text-destructive truncate">{job.error_message}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
