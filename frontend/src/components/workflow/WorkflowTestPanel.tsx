import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TriggerNodeData } from '@/types/workflow';
import { Loader2, User, Activity, BarChart, X } from '@/components/icons';

type TriggerCategory = 'contact' | 'simulation' | 'report';

interface WorkflowTestPanelProps {
  workflowId: string;
  clientId: string;
  nodes: { id: string; type: string; data: any }[];
  onTestComplete: (executionId: string) => void;
  onClose: () => void;
}

const fieldStyle = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' } as const;

interface RecordOption {
  id: string;
  label: string;
  subtitle?: string;
}

export default function WorkflowTestPanel({ workflowId, clientId, nodes, onTestComplete, onClose }: WorkflowTestPanelProps) {
  const [testing, setTesting] = useState(false);
  const [category, setCategory] = useState<TriggerCategory | ''>('');
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const [records, setRecords] = useState<RecordOption[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const triggerNode = nodes.find(n => n.type === 'trigger');
  const triggerData = triggerNode?.data as TriggerNodeData | undefined;

  const detectCategory = useCallback((): TriggerCategory | null => {
    if (!triggerData?.triggerType) return null;
    const t = triggerData.triggerType;
    if (t.startsWith('contact_')) return 'contact';
    if (t.startsWith('simulation_')) return 'simulation';
    if (t === 'simulation_report_generated') return 'report';
    return null;
  }, [triggerData]);

  useEffect(() => {
    const detected = detectCategory();
    if (detected) setCategory(detected);
  }, [detectCategory]);

  useEffect(() => {
    if (!category) return;
    loadRecords(category);
  }, [category, clientId]);

  async function loadRecords(cat: TriggerCategory) {
    setLoadingRecords(true);
    setRecords([]);
    setSelectedRecordId('');

    try {
      if (cat === 'contact') {
        const { data } = await supabase
          .from('leads')
          .select('id, first_name, last_name, email, phone, created_at')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(100);

        setRecords((data || []).map(c => {
          const name = [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unnamed';
          return { id: c.id, label: name, subtitle: c.email || c.phone || '' };
        }));
      } else if (cat === 'simulation') {
        const { data } = await (supabase as any)
          .from('simulations')
          .select('id, status, created_at, agent_number')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(50);

        setRecords((data || []).map((s: any) => ({
          id: s.id,
          label: `Simulation — ${s.status}`,
          subtitle: new Date(s.created_at).toLocaleDateString(),
        })));
      } else if (cat === 'report') {
        const { data } = await (supabase as any)
          .from('simulation_reports')
          .select('id, simulation_id, created_at')
          .order('created_at', { ascending: false })
          .limit(50);

        setRecords((data || []).map((r: any) => ({
          id: r.id,
          label: `Report ${r.id.slice(0, 8)}`,
          subtitle: new Date(r.created_at).toLocaleDateString(),
        })));
      }
    } catch {
      // Silently handle
    }
    setLoadingRecords(false);
  }

  function buildTriggerPayload(): { trigger_type: string; trigger_data: Record<string, any> } | null {
    if (!triggerData?.triggerType || !selectedRecordId) return null;
    const type = triggerData.triggerType;

    if (category === 'contact') {
      const contact = records.find(r => r.id === selectedRecordId);
      return {
        trigger_type: type,
        trigger_data: { contact_id: selectedRecordId, client_id: clientId, contact_data: { name: contact?.label || '' } },
      };
    }
    if (category === 'simulation') {
      return { trigger_type: type, trigger_data: { simulation_id: selectedRecordId, client_id: clientId } };
    }
    if (category === 'report') {
      return { trigger_type: type, trigger_data: { simulation_id: selectedRecordId, client_id: clientId, report_data: {} } };
    }
    return null;
  }

  async function handleTest() {
    const payload = buildTriggerPayload();
    if (!payload) { toast.error('Select a record to test with'); return; }

    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('workflow-execute', {
        body: { ...payload, client_id: clientId, workflow_id: workflowId, is_test: true },
      });
      if (error) throw error;
      const execs = data?.executions || [];
      if (execs.length === 0) { toast.info('No matching trigger found'); }
      else { onTestComplete(execs[0].id); }
    } catch (err: any) {
      toast.error(err.message || 'Test failed');
    } finally {
      setTesting(false);
    }
  }

  const categories: { value: TriggerCategory; label: string; icon: React.ReactNode }[] = [
    { value: 'contact', label: 'Contact Trigger', icon: <User className="w-4 h-4" /> },
    { value: 'simulation', label: 'Simulation Trigger', icon: <Activity className="w-4 h-4" /> },
    { value: 'report', label: 'Report Trigger', icon: <BarChart className="w-4 h-4" /> },
  ];

  return (
    <div className="w-[408px] h-full bg-card overflow-hidden flex flex-col" style={{ borderLeft: '3px groove hsl(var(--border-groove))' }}>
      <div className="px-4 shrink-0 flex items-center justify-between" style={{ height: 52, borderBottom: '3px groove hsl(var(--border-groove))' }}>
        <h3 className="text-foreground uppercase" style={{ fontFamily: "'VT323', monospace", fontSize: '22px' }}>
          Test Workflow
        </h3>
        <button
          className="groove-btn !h-8 !w-8 !p-0 !min-h-[32px] !min-w-[32px] flex items-center justify-center bg-muted/50"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-3 space-y-4 flex-1 overflow-y-auto">
        <div>
          <label className="text-foreground capitalize block mb-1" style={fieldStyle}>Trigger Type</label>
          <div className="space-y-1.5">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`w-full text-left px-3 py-2 groove-border transition-all ${
                  category === cat.value ? 'bg-primary/15 border-primary' : 'bg-card hover:bg-accent'
                }`}
                style={{ boxShadow: category === cat.value ? '0 0 0 1px hsl(var(--primary))' : undefined }}
              >
                <div className="flex items-center gap-2">
                  <span className="flex items-center">{cat.icon}</span>
                  <span className="text-foreground" style={fieldStyle}>{cat.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {category && (
          <div>
            <label className="text-foreground capitalize block mb-1" style={fieldStyle}>
              Select {category === 'contact' ? 'Contact' : category === 'simulation' ? 'Simulation' : 'Report'}
            </label>
            {loadingRecords ? (
              <div className="flex items-center gap-2 p-3 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span style={fieldStyle}>Loading records...</span>
              </div>
            ) : records.length === 0 ? (
              <div className="groove-border p-3">
                <span className="text-muted-foreground" style={fieldStyle}>No records found</span>
              </div>
            ) : (
              <Select value={selectedRecordId} onValueChange={setSelectedRecordId}>
                <SelectTrigger><SelectValue placeholder="Choose a record..." /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {records.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      <div>
                        <div style={fieldStyle}>{r.label}</div>
                        {r.subtitle && <div className="text-muted-foreground" style={fieldStyle}>{r.subtitle}</div>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {selectedRecordId && (
          <div>
            <label className="text-foreground capitalize block mb-1" style={fieldStyle}>Execute</label>
            <Button
              onClick={handleTest}
              disabled={testing}
              className="w-full groove-btn"
              style={{ fontFamily: "'VT323', monospace", fontSize: '18px' }}
            >
              {testing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  RUNNING...
                </span>
              ) : '▶ RUN TEST'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
