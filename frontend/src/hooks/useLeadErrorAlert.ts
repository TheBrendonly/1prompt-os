import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const LEAD_ERROR_DISMISSED_EVENT = 'lead-error-dismissed';

interface LeadErrorDismissedDetail {
  clientId: string;
  leadId: string;
  errorId: string;
}

export interface ActiveError {
  id: string;
  title: string | null;
  error_message: string;
  error_type: string;
  created_at: string;
  lead_id: string | null;
}

const emitLeadErrorDismissed = (detail: LeadErrorDismissedDetail) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<LeadErrorDismissedDetail>(LEAD_ERROR_DISMISSED_EVENT, {
      detail,
    }),
  );
};

const buildLatestActiveErrorMap = (
  errors: Array<{ id: string; lead_id: string | null }> | null,
  dismissedIds: Set<string>,
) => {
  const latestActiveErrorIds = new Map<string, string>();
  const processedLeadIds = new Set<string>();

  for (const error of errors || []) {
    if (!error.lead_id || processedLeadIds.has(error.lead_id)) continue;

    processedLeadIds.add(error.lead_id);

    if (!dismissedIds.has(error.id)) {
      latestActiveErrorIds.set(error.lead_id, error.id);
    }
  }

  return latestActiveErrorIds;
};

/**
 * Fetches the latest error for a specific lead and only shows it if that
 * specific error has not been dismissed yet.
 */
export function useLeadErrorAlert(
  clientId: string | undefined,
  leadGhlId: string | null | undefined,
  ghlLocationId: string | null | undefined,
) {
  const [activeError, setActiveError] = useState<ActiveError | null>(null);
  const mountedRef = useRef(true);

  const fetchActiveError = useCallback(async () => {
    if (!clientId || !leadGhlId || !ghlLocationId) {
      setActiveError(null);
      return;
    }

    try {
      const { data: latestError, error: latestErrorQueryError } = await (supabase as any)
        .from('error_logs')
        .select('id, title, error_message, error_type, created_at, lead_id')
        .eq('client_ghl_account_id', ghlLocationId)
        .eq('lead_id', leadGhlId)
        .eq('severity', 'error')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestErrorQueryError) throw latestErrorQueryError;
      if (!mountedRef.current) return;

      if (!latestError) {
        setActiveError(null);
        return;
      }

      const { data: dismissal, error: dismissalQueryError } = await (supabase as any)
        .from('dismissed_error_alerts')
        .select('error_log_id')
        .eq('client_id', clientId)
        .eq('lead_id', leadGhlId)
        .eq('error_log_id', latestError.id)
        .limit(1)
        .maybeSingle();

      if (dismissalQueryError) throw dismissalQueryError;
      if (!mountedRef.current) return;

      setActiveError(dismissal ? null : latestError);
    } catch (err) {
      console.error('Error fetching active error:', err);
    }
  }, [clientId, leadGhlId, ghlLocationId]);

  useEffect(() => {
    mountedRef.current = true;
    fetchActiveError();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchActiveError]);

  useEffect(() => {
    if (!ghlLocationId || !leadGhlId) return;

    const channel = supabase
      .channel(`lead-error-${leadGhlId}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'error_logs',
          filter: `client_ghl_account_id=eq.${ghlLocationId}`,
        },
        (payload: any) => {
          const row = payload.new;
          if (row.severity === 'error' && row.lead_id === leadGhlId) {
            setActiveError({
              id: row.id,
              title: row.title,
              error_message: row.error_message,
              error_type: row.error_type,
              created_at: row.created_at,
              lead_id: row.lead_id,
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ghlLocationId, leadGhlId]);

  useEffect(() => {
    if (!clientId || !leadGhlId) return;

    const channel = supabase
      .channel(`lead-error-dismissal-${clientId}-${leadGhlId}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dismissed_error_alerts',
          filter: `client_id=eq.${clientId}`,
        },
        (payload: any) => {
          if (payload.new?.lead_id === leadGhlId) {
            fetchActiveError();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, leadGhlId, fetchActiveError]);

  const dismissError = useCallback(async () => {
    if (!activeError || !clientId || !leadGhlId) return;

    const errorId = activeError.id;
    setActiveError(null);

    try {
      const { error } = await (supabase as any).from('dismissed_error_alerts').upsert(
        {
          client_id: clientId,
          lead_id: leadGhlId,
          error_log_id: errorId,
        },
        { onConflict: 'client_id,lead_id,error_log_id' },
      );

      if (error) throw error;

      emitLeadErrorDismissed({
        clientId,
        leadId: leadGhlId,
        errorId,
      });
    } catch (err) {
      console.error('Error dismissing error alert:', err);
      fetchActiveError();
    }
  }, [activeError, clientId, leadGhlId, fetchActiveError]);

  return { activeError, dismissError, refetchError: fetchActiveError };
}

/**
 * Batch-fetches lead IDs whose latest error is still active.
 * Older historical errors no longer keep the sidebar highlighted.
 */
export function useLeadsWithErrors(
  clientId: string | undefined,
  ghlLocationId: string | null | undefined,
) {
  const [errorLeadIds, setErrorLeadIds] = useState<Set<string>>(new Set());
  const latestActiveErrorIdsRef = useRef<Map<string, string>>(new Map());

  const applyActiveLeadMap = useCallback((nextMap: Map<string, string>) => {
    latestActiveErrorIdsRef.current = nextMap;
    setErrorLeadIds(new Set(nextMap.keys()));
  }, []);

  const fetchErrorLeads = useCallback(async () => {
    if (!clientId || !ghlLocationId) {
      applyActiveLeadMap(new Map());
      return;
    }

    try {
      const [{ data: dismissed, error: dismissedQueryError }, { data: errors, error: errorsQueryError }] = await Promise.all([
        (supabase as any)
          .from('dismissed_error_alerts')
          .select('error_log_id')
          .eq('client_id', clientId),
        (supabase as any)
          .from('error_logs')
          .select('id, lead_id, created_at')
          .eq('client_ghl_account_id', ghlLocationId)
          .eq('severity', 'error')
          .order('created_at', { ascending: false })
          .limit(1000),
      ]);

      if (dismissedQueryError) throw dismissedQueryError;
      if (errorsQueryError) throw errorsQueryError;

      const dismissedIds = new Set<string>((dismissed || []).map((row: any) => row.error_log_id));
      applyActiveLeadMap(buildLatestActiveErrorMap(errors, dismissedIds));
    } catch (err) {
      console.error('Error fetching leads with errors:', err);
    }
  }, [applyActiveLeadMap, clientId, ghlLocationId]);

  const clearLeadError = useCallback(
    (leadId: string, errorId?: string) => {
      const currentErrorId = latestActiveErrorIdsRef.current.get(leadId);
      if (!currentErrorId) return;

      if (errorId && currentErrorId !== errorId) {
        fetchErrorLeads();
        return;
      }

      const nextMap = new Map(latestActiveErrorIdsRef.current);
      nextMap.delete(leadId);
      applyActiveLeadMap(nextMap);
    },
    [applyActiveLeadMap, fetchErrorLeads],
  );

  useEffect(() => {
    fetchErrorLeads();
  }, [fetchErrorLeads]);

  useEffect(() => {
    if (!ghlLocationId || !clientId) return;

    const channel = supabase
      .channel(`error-leads-${clientId}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'error_logs',
          filter: `client_ghl_account_id=eq.${ghlLocationId}`,
        },
        (payload: any) => {
          const row = payload.new;
          if (row?.severity !== 'error' || !row?.lead_id) return;

          const nextMap = new Map(latestActiveErrorIdsRef.current);
          nextMap.set(row.lead_id, row.id);
          applyActiveLeadMap(nextMap);
        },
      )
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dismissed_error_alerts',
          filter: `client_id=eq.${clientId}`,
        },
        (payload: any) => {
          const leadId = payload.new?.lead_id;
          const errorId = payload.new?.error_log_id;

          if (!leadId || !errorId) {
            fetchErrorLeads();
            return;
          }

          clearLeadError(leadId, errorId);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [applyActiveLeadMap, clearLeadError, clientId, fetchErrorLeads, ghlLocationId]);

  useEffect(() => {
    if (!clientId || typeof window === 'undefined') return;

    const handleDismissed = (event: Event) => {
      const detail = (event as CustomEvent<LeadErrorDismissedDetail>).detail;
      if (!detail || detail.clientId !== clientId) return;
      clearLeadError(detail.leadId, detail.errorId);
    };

    window.addEventListener(LEAD_ERROR_DISMISSED_EVENT, handleDismissed as EventListener);

    return () => {
      window.removeEventListener(LEAD_ERROR_DISMISSED_EVENT, handleDismissed as EventListener);
    };
  }, [clearLeadError, clientId]);

  return errorLeadIds;
}
