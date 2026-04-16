import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from '@/components/icons';
import { insertDefaultCampaignWidgets } from '@/lib/campaignWidgets';

const FONT = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' } as const;

interface StartEngagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  ghlContactId: string;
  ghlAccountId: string;
  contactName: string;
  contactPhone: string;
}

export function StartEngagementDialog({
  open,
  onOpenChange,
  clientId,
  ghlContactId,
  ghlAccountId,
  contactName,
  contactPhone,
}: StartEngagementDialogProps) {
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [campaignName, setCampaignName] = useState('');

  useEffect(() => {
    if (open) setCampaignName('');
  }, [open]);

  const handleStart = async () => {
    if (!campaignName.trim()) { toast.error('Campaign name is required'); return; }
    setStarting(true);
    try {
      // Get workflow_id
      const { data: wf } = await (supabase as any)
        .from('engagement_workflows')
        .select('id')
        .eq('client_id', clientId)
        .limit(1)
        .maybeSingle();

      // Create engagement_campaigns row
      const { data: campaign, error: campErr } = await (supabase as any)
        .from('engagement_campaigns')
        .insert({ client_id: clientId, workflow_id: wf?.id || null, name: campaignName.trim() })
        .select('id')
        .single();
      if (campErr || !campaign) throw new Error('Failed to create campaign');

      // Auto-create default campaign widgets
      await insertDefaultCampaignWidgets(clientId, campaign.id);

      const { error } = await supabase.functions.invoke('trigger-engagement', {
        body: {
          lead_id: ghlContactId,
          client_id: clientId,
          workflow_id: wf?.id || null,
          contact_name: contactName,
          contact_phone: contactPhone,
          campaign_id: campaign.id,
        },
      });

      if (error) throw error;

      toast.success('Engagement started');
      onOpenChange(false);
      navigate(`/client/${clientId}/workflows/engagement`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to start engagement');
    }
    setStarting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md !p-0">
        <DialogHeader>
          <DialogTitle>START ENGAGEMENT SEQUENCE</DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <p className="text-muted-foreground" style={FONT}>
            This will enroll <span className="text-foreground font-medium">{contactName || 'this lead'}</span> into the engagement workflow and begin sending automated messages. The sequence will stop automatically if the lead replies.
          </p>
          <div className="space-y-1">
            <Label style={FONT} className="text-foreground">Campaign Name</Label>
            <Input
              value={campaignName}
              onChange={e => setCampaignName(e.target.value)}
              placeholder="e.g. Spring Reactivation 2026"
              style={FONT}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleStart}
              disabled={starting || !campaignName.trim()}
              className="flex-1 groove-btn field-text"
            >
              {starting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              START NOW
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 groove-btn field-text"
            >
              CANCEL
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to check if engagement workflow exists with at least one node.
 */
export function useHasEngagementWorkflow(clientId: string | undefined) {
  const [hasWorkflow, setHasWorkflow] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    (async () => {
      const { data } = await (supabase as any)
        .from('engagement_workflows')
        .select('id, nodes')
        .eq('client_id', clientId)
        .limit(1)
        .maybeSingle();
      const nodes = Array.isArray(data?.nodes) ? data.nodes : [];
      setHasWorkflow(nodes.length > 0);
    })();
  }, [clientId]);

  return hasWorkflow;
}
