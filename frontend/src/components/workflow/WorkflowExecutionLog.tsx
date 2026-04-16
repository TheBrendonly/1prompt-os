import { useState, useEffect, useCallback } from 'react';
import { useCreatorMode } from '@/hooks/useCreatorMode';
import { supabase } from '@/integrations/supabase/client';
import type { WorkflowExecution, WorkflowExecutionStep } from '@/types/workflow';
import { format } from 'date-fns';
import { StatusTag } from '@/components/StatusTag';
import { X, Search, ChevronLeft, ChevronRight, RefreshCw } from '@/components/icons';
import { Input } from '@/components/ui/input';

interface WorkflowExecutionLogProps {
  workflowId: string;
  onSelectExecution: (execution: WorkflowExecution, steps: WorkflowExecutionStep[]) => void;
  onClose: () => void;
}

const fieldStyle = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' } as const;
const PAGE_SIZE = 100;

export default function WorkflowExecutionLog({ workflowId, onSelectExecution, onClose }: WorkflowExecutionLogProps) {
  const { cb } = useCreatorMode();
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const fetchExecutions = useCallback(async () => {
    setLoading(true);
    const from = (currentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // Get count
    const { count } = await (supabase as any)
      .from('workflow_executions')
      .select('id', { count: 'exact', head: true })
      .eq('workflow_id', workflowId);

    setTotalCount(count ?? 0);

    // Get page of executions
    const { data, error } = await (supabase as any)
      .from('workflow_executions')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('started_at', { ascending: false })
      .range(from, to);

    if (!error) setExecutions((data as WorkflowExecution[]) || []);
    setLoading(false);
  }, [workflowId, currentPage]);

  useEffect(() => {
    fetchExecutions();
    const channel = supabase
      .channel(`workflow-executions-${workflowId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workflow_executions',
        filter: `workflow_id=eq.${workflowId}`,
      }, () => {
        fetchExecutions();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [workflowId, fetchExecutions]);

  async function handleSelectExecution(execution: WorkflowExecution) {
    const { data: steps } = await (supabase as any)
      .from('workflow_execution_steps')
      .select('*')
      .eq('execution_id', execution.id)
      .order('started_at', { ascending: true });

    onSelectExecution(execution, (steps as WorkflowExecutionStep[]) || []);
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'positive' as const;
      case 'failed': return 'negative' as const;
      case 'running': return 'warning' as const;
      default: return 'neutral' as const;
    }
  };

  // Filter executions by search query against trigger_data fields
  const filteredExecutions = searchQuery.trim()
    ? executions.filter((exec) => {
        const q = searchQuery.trim().toLowerCase();
        const td = exec.trigger_data || {};
        const searchableValues = [
          td.first_name,
          td.last_name,
          td.email,
          td.phone,
          td.lead_id,
          td.contact_id,
          // Combined name
          [td.first_name, td.last_name].filter(Boolean).join(' '),
        ];
        return searchableValues.some(
          (v) => typeof v === 'string' && v.toLowerCase().includes(q)
        );
      })
    : executions;

  return (
    <div className="w-[408px] h-full bg-card overflow-hidden flex flex-col" style={{ borderLeft: '3px groove hsl(var(--border-groove))' }}>
      <div
        className="px-4 shrink-0 flex items-center justify-between"
        style={{ height: 52, borderBottom: '3px groove hsl(var(--border-groove))' }}
      >
        <h3
          className="text-foreground uppercase"
          style={{ fontFamily: "'VT323', monospace", fontSize: '22px' }}
        >
          Executions
        </h3>
        <div className="flex items-center gap-1">
          <button
            className="groove-btn !h-8 !w-8 !p-0 !min-h-[32px] !min-w-[32px] flex items-center justify-center bg-muted/50"
            onClick={() => fetchExecutions()}
            title="Reload executions"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            className="groove-btn !h-8 !w-8 !p-0 !min-h-[32px] !min-w-[32px] flex items-center justify-center bg-muted/50"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-4 py-2 shrink-0" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
        <Input
          placeholder="Search by name, email, phone, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-foreground uppercase" style={{ fontFamily: "'VT323', monospace", fontSize: '22px' }}>
            Loading...
          </div>
        ) : filteredExecutions.length === 0 ? (
          <div className="p-4 text-muted-foreground" style={fieldStyle}>
            {searchQuery.trim()
              ? 'No executions match your search.'
              : 'No executions yet. Activate the workflow and trigger an event, or use the Test button.'}
          </div>
        ) : (
          <div className="divide-y divide-dashed divide-border">
            {filteredExecutions.map((exec) => (
              <button
                key={exec.id}
                onClick={() => handleSelectExecution(exec)}
                className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <StatusTag variant={statusVariant(exec.status)}>
                    {exec.status}
                  </StatusTag>
                  <span className="text-muted-foreground" style={fieldStyle}>
                    {format(new Date(exec.started_at), 'MMM d, HH:mm:ss')}
                  </span>
                </div>
                <div className={`text-muted-foreground mt-1 ${cb}`} style={fieldStyle}>
                  {(() => {
                    const td = exec.trigger_data || {};
                    const name = [td.first_name, td.last_name].filter(Boolean).join(' ');
                    const summary = td.summary || exec.trigger_type.replace(/_/g, ' ');
                    return name ? `${name} — ${summary}` : summary;
                  })()}
                </div>
              </button>
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 py-3">
                <button
                  className="groove-btn !h-8 !w-8 !p-0 !min-h-[32px] !min-w-[32px] flex items-center justify-center bg-muted/50 disabled:opacity-40"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-foreground px-2" style={fieldStyle}>
                  {currentPage} / {totalPages}
                </span>
                <button
                  className="groove-btn !h-8 !w-8 !p-0 !min-h-[32px] !min-w-[32px] flex items-center justify-center bg-muted/50 disabled:opacity-40"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
