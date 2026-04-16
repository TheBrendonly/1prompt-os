
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, Play, Pause, RefreshCw } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import LeadRow from './LeadRow';
import SimpleBatchTimer from './SimpleBatchTimer';

interface Campaign {
  id: string;
  campaign_name: string;
  reactivation_notes: string | null;
  status: string;
  total_leads: number;
  processed_leads: number;
  created_at: string;
  webhook_url: string;
  timezone?: string;
  batch_size?: number;
  batch_interval_minutes?: number;
}

interface Lead {
  id: string;
  campaign_id: string;
  status: string;
  lead_data: any;
  processed_at: string | null;
  error_message: string | null;
  scheduled_for: string | null;
}

interface ExecutionDashboardProps {
  campaignId: string | null;
}

const ExecutionDashboard: React.FC<ExecutionDashboardProps> = ({ campaignId }) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (campaignId) {
      loadCampaignData();
      setupRealtimeSubscription();
    }
  }, [campaignId]);

  const loadCampaignData = async () => {
    if (!campaignId) return;
    
    setLoading(true);
    try {
      // Load campaign details
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;
      setCampaign(campaignData);

      // Load all leads for this campaign
      const { data: leadsData, error: leadsError } = await supabase
        .from('campaign_leads')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;
      setLeads(leadsData || []);
      setTotalLeads(leadsData?.length || 0);

      console.log('Loaded campaign data:', campaignData);
      console.log('Loaded leads:', leadsData);
    } catch (error) {
      console.error('Error loading campaign data:', error);
      toast({
        title: "Error loading campaign",
        description: "Failed to load campaign data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!campaignId) return;

    const channel = supabase
      .channel(`campaign-updates-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaigns',
          filter: `id=eq.${campaignId}`,
        },
        (payload) => {
          console.log('Campaign update:', payload);
          if (payload.new) {
            setCampaign(payload.new as Campaign);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          console.log('Lead update:', payload);
          loadCampaignData(); // Refresh leads data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const pauseCampaign = async () => {
    if (!campaign) return;
    
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'paused' })
        .eq('id', campaign.id);

      if (error) throw error;
      
      toast({
        title: "Campaign paused",
        description: "Campaign has been paused successfully",
      });
    } catch (error) {
      console.error('Error pausing campaign:', error);
      toast({
        title: "Error",
        description: "Failed to pause campaign",
        variant: "destructive",
      });
    }
  };

  const resumeCampaign = async () => {
    if (!campaign) return;
    
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'active' })
        .eq('id', campaign.id);

      if (error) throw error;
      
      toast({
        title: "Campaign resumed",
        description: "Campaign has been resumed successfully",
      });
    } catch (error) {
      console.error('Error resuming campaign:', error);
      toast({
        title: "Error",
        description: "Failed to resume campaign",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      active: "default",
      paused: "secondary",
      completed: "default",
      failed: "destructive",
    };
    
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  if (!campaignId || !campaign) {
    return (
      <div className="material-surface p-8 text-center">
        <BarChart3 className="w-12 h-12 text-on-surface-variant mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-on-surface mb-2">No Active Campaign</h3>
        <p className="text-on-surface-variant">Launch a campaign to see execution details here</p>
      </div>
    );
  }

  const completedLeads = leads.filter(lead => lead.status === 'completed').length;
  const progressPercentage = totalLeads > 0 ? (completedLeads / totalLeads) * 100 : 0;

  return (
    <div className="material-surface p-8 animate-fade-in">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-semibold text-on-surface">Execution Dashboard</h2>
        </div>
        <p className="text-on-surface-variant">Monitor your campaign progress and manage leads</p>
      </div>

      {/* Campaign Overview */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-on-surface">{campaign.campaign_name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              {getStatusBadge(campaign.status)}
              <span className="text-sm text-on-surface-variant">
                {completedLeads}/{totalLeads} leads completed
              </span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {campaign.status === 'active' ? (
              <Button
                onClick={pauseCampaign}
                size="sm"
                className="flex items-center space-x-1 bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </Button>
            ) : campaign.status === 'paused' && (
              <Button
                onClick={resumeCampaign}
                size="sm"
                className="flex items-center space-x-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Play className="w-4 h-4" />
                <span>Resume</span>
              </Button>
            )}
            
            <Button
              onClick={loadCampaignData}
              size="sm"
              className="flex items-center space-x-1 bg-muted text-muted-foreground hover:bg-muted/80"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-on-surface-variant">Progress</span>
            <span className="text-on-surface font-medium">{progressPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>

        {/* Batch Timer */}
        <SimpleBatchTimer 
          campaignId={campaign.id} 
          campaignStatus={campaign.status}
        />
      </div>

      {/* Leads List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-on-surface">All Leads ({totalLeads})</h4>
          <div className="text-sm text-on-surface-variant">
            Pending: {leads.filter(l => l.status === 'pending').length} | 
            Completed: {completedLeads} | 
            Failed: {leads.filter(l => l.status === 'failed').length}
          </div>
        </div>
        
        {leads.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant">
            <p>No leads found for this campaign</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {leads.map((lead, index) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                campaignWebhookUrl={campaign.webhook_url}
                campaignName={campaign.campaign_name}
                campaignNotes={campaign.reactivation_notes}
                onLeadUpdate={loadCampaignData}
                leadNumber={index + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutionDashboard;
