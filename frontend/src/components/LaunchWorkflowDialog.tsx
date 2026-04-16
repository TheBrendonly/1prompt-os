import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogClose, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Zap, X } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { Workflow } from '@/types/workflow';

const FONT = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' } as const;
const LABEL_FONT = { fontFamily: "'VT323', monospace", fontSize: '18px', letterSpacing: '0.5px' } as const;

interface LeadData {
  lead_id?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  business_name?: string;
  custom_fields?: Record<string, any>;
  [key: string]: any;
}

interface EngagementWorkflow {
  id: string;
  name: string;
  is_active: boolean;
}

interface LaunchWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  leads: LeadData[];
  leadCount: number;
}

export function LaunchWorkflowDialog({
  open,
  onOpenChange,
  clientId,
  leads,
  leadCount,
}: LaunchWorkflowDialogProps) {
  const [step, setStep] = useState<'select' | 'confirm'>('select');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [engagementWorkflows, setEngagementWorkflows] = useState<EngagementWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'custom' | 'engagement' | null>(null);
  const [launching, setLaunching] = useState(false);

  const fetchWorkflows = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const [wfRes, engRes] = await Promise.all([
        (supabase as any)
          .from('workflows')
          .select('*')
          .eq('client_id', clientId)
          .eq('is_active', true),
        (supabase as any)
          .from('engagement_workflows')
          .select('id, name, is_active')
          .eq('client_id', clientId)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
      ]);

      const manualWorkflows = ((wfRes.data as Workflow[]) || []).filter(wf => {
        const nodes = wf.nodes || [];
        return nodes.some(n => n.type === 'trigger' && (n.data as any)?.triggerType === 'manual');
      });
      setWorkflows(manualWorkflows);
      setEngagementWorkflows(engRes.data || []);
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (open) {
      setStep('select');
      setSelectedWorkflowId(null);
      setSelectedType(null);
      fetchWorkflows();
    }
  }, [open, fetchWorkflows]);

  const selectedWorkflowName = selectedType === 'engagement'
    ? (engagementWorkflows.find(e => e.id === selectedWorkflowId)?.name || 'Engagement Workflow')
    : workflows.find(w => w.id === selectedWorkflowId)?.name || '';

  const handleLaunch = async () => {
    setLaunching(true);
    try {
      if (selectedType === 'engagement' && selectedWorkflowId) {
        // Look up the existing linked campaign
        const { data: campaign } = await (supabase as any)
          .from('engagement_campaigns')
          .select('id')
          .eq('workflow_id', selectedWorkflowId)
          .limit(1)
          .maybeSingle();

        if (!campaign) { toast.error('No campaign linked to this workflow'); setLaunching(false); return; }

        let successCount = 0;
        for (const lead of leads) {
          try {
            await supabase.functions.invoke('trigger-engagement', {
              body: {
                lead_id: lead.lead_id || lead.id,
                client_id: clientId,
                workflow_id: selectedWorkflowId,
                contact_name: [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown',
                contact_phone: lead.phone || '',
                campaign_id: campaign.id,
              },
            });
            successCount++;
          } catch {
            // continue
          }
        }
        toast.success(`Launched engagement for ${successCount} lead${successCount !== 1 ? 's' : ''}`);
      } else if (selectedType === 'custom' && selectedWorkflowId) {
        let successCount = 0;
        for (const lead of leads) {
          try {
            await supabase.functions.invoke('workflow-execute', {
              body: {
                trigger_type: 'manual',
                workflow_id: selectedWorkflowId,
                client_id: clientId,
                trigger_data: {
                  contact_id: lead.lead_id || '',
                  client_id: clientId,
                  first_name: lead.first_name || '',
                  last_name: lead.last_name || '',
                  phone: lead.phone || '',
                  email: lead.email || '',
                  business_name: lead.business_name || '',
                  custom_fields: lead.custom_fields || {},
                  contact_data: lead,
                },
              },
            });
            successCount++;
          } catch {
            // continue
          }
        }
        toast.success(`Launched workflow for ${successCount} lead${successCount !== 1 ? 's' : ''}`);
      }

      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to launch workflow');
    } finally {
      setLaunching(false);
    }
  };

  const hasWorkflows = workflows.length > 0 || engagementWorkflows.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col !p-0 overflow-hidden" style={{ width: '544px', maxWidth: '90vw', height: '630px', maxHeight: '80vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 shrink-0" style={{ borderBottom: '3px groove hsl(var(--border-groove))', paddingTop: '14px', paddingBottom: '14px' }}>
          <DialogTitle>{step === 'select' ? 'LAUNCH CAMPAIGN' : 'CONFIRM CAMPAIGN'}</DialogTitle>
          <DialogClose asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8 !bg-muted !border-border hover:!bg-accent shrink-0" title="Close">
              <X className="w-4 h-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </div>

        {step === 'select' && (
          <>
            <div className="px-6 py-5 space-y-4 flex-1 min-h-0 overflow-y-auto">
              <p style={FONT} className="text-muted-foreground">
                Select a campaign to enroll {leadCount.toLocaleString()} lead{leadCount !== 1 ? 's' : ''} in.
              </p>

              {loading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground" style={FONT}>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading workflows...
                </div>
              ) : !hasWorkflows ? (
                <div className="py-8 text-center text-muted-foreground" style={FONT}>
                  No active workflows found. Create and enable a workflow to use this feature.
                </div>
              ) : (
                <div className="space-y-2">
                  {engagementWorkflows.map(ew => (
                    <button
                      key={ew.id}
                      onClick={() => { setSelectedWorkflowId(ew.id); setSelectedType('engagement'); }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 groove-border text-left transition-colors',
                        selectedType === 'engagement' && selectedWorkflowId === ew.id ? 'bg-primary/10' : 'bg-card hover:bg-muted/40'
                      )}
                    >
                      <Checkbox checked={selectedType === 'engagement' && selectedWorkflowId === ew.id} className="flex-shrink-0" tabIndex={-1} />
                      <div className="flex-1 min-w-0">
                        <div style={{ ...FONT, fontWeight: 500 }} className="text-foreground">
                          {ew.name}
                        </div>
                        <div style={{ ...FONT }} className="text-muted-foreground mt-0.5">
                          Multi-step campaign sequence with reply detection
                        </div>
                      </div>
                    </button>
                  ))}

                  {workflows.map(wf => (
                    <button
                      key={wf.id}
                      onClick={() => { setSelectedWorkflowId(wf.id); setSelectedType('custom'); }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 groove-border text-left transition-colors',
                        selectedType === 'custom' && selectedWorkflowId === wf.id ? 'bg-primary/10' : 'bg-card hover:bg-muted/40'
                      )}
                    >
                      <Checkbox checked={selectedType === 'custom' && selectedWorkflowId === wf.id} className="flex-shrink-0" tabIndex={-1} />
                      <div className="flex-1 min-w-0">
                        <div style={{ ...FONT, fontWeight: 500 }} className="text-foreground">
                          {wf.name}
                        </div>
                        {wf.description && (
                          <div style={{ ...FONT }} className="text-muted-foreground mt-0.5">
                            {wf.description}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-2 shrink-0">
              <Button
                className="flex-1 groove-btn"
                style={LABEL_FONT}
                onClick={() => onOpenChange(false)}
              >
                CANCEL
              </Button>
              <Button
                className={cn('flex-1 groove-btn-positive', !selectedWorkflowId && 'opacity-50')}
                style={LABEL_FONT}
                disabled={!selectedWorkflowId}
                onClick={() => setStep('confirm')}
              >
                CONTINUE
              </Button>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="px-6 py-5 flex-1 min-h-0">
              <div style={FONT} className="space-y-3">
                <p className="text-destructive">
                  You are about to enroll <span className="font-bold">{leadCount.toLocaleString()} lead{leadCount !== 1 ? 's' : ''}</span> into:
                </p>
                <p className="text-primary font-medium">
                  {selectedWorkflowName}
                </p>
                <p className="text-muted-foreground" style={FONT}>
                  All selected leads will be added to this campaign and will start processing immediately. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-2 shrink-0">
              <Button
                className="flex-1 groove-btn"
                style={LABEL_FONT}
                onClick={() => setStep('select')}
                disabled={launching}
              >
                BACK
              </Button>
              <Button
                className="flex-1 groove-btn-positive"
                style={LABEL_FONT}
                onClick={handleLaunch}
                disabled={launching}
              >
                {launching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    LAUNCHING...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-1.5" />
                    CONFIRM CAMPAIGN
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
