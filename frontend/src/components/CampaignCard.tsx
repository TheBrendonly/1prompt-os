import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, CheckCircle, Clock, Eye, Trash2, Pause, Play, Timer, Settings, AlarmClock, Globe, Calendar } from '@/components/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatLeadTime } from '@/utils/timeUtils';

interface Campaign {
  id: string;
  campaign_name: string;
  status: string;
  total_leads: number;
  processed_leads: number;
  created_at: string;
  batch_size?: number;
  batch_interval_minutes?: number;
  lead_delay_seconds?: number;
  start_time?: string;
  end_time?: string;
  days_of_week?: number[];
  timezone?: string;
}

interface CampaignCardProps {
  campaign: Campaign;
  onDelete?: () => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onDelete }) => {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const { toast } = useToast();
  const [actualProcessedCount, setActualProcessedCount] = useState(campaign.processed_leads);
  const [currentStatus, setCurrentStatus] = useState(campaign.status);

  useEffect(() => { setCurrentStatus(campaign.status); }, [campaign.status]);

  useEffect(() => {
    const fetchLeadCounts = async () => {
      try {
        const { data: leads, error } = await supabase
          .from('campaign_leads')
          .select('status')
          .eq('campaign_id', campaign.id);
        if (error) return;
        if (leads) {
          setActualProcessedCount(leads.filter(l => l.status === 'completed' || l.status === 'failed').length);
        }
      } catch (error) {
        console.error('Error in fetchLeadCounts:', error);
      }
    };

    fetchLeadCounts();
    const channel = supabase
      .channel(`campaign-card-${campaign.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads', filter: `campaign_id=eq.${campaign.id}` }, () => fetchLeadCounts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [campaign.id]);

  const completionPercentage = campaign.total_leads > 0
    ? Math.round((actualProcessedCount / campaign.total_leads) * 100)
    : 0;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'badge-mono badge-mono-green',
      active: 'badge-mono badge-mono-blue',
      paused: 'badge-mono badge-mono-amber',
    };
    return styles[status] || 'badge-mono badge-mono-muted';
  };

  const formatDaysOfWeek = (days: number[] = []) => {
    const dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (days.length === 0) return 'Not set';
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && [1,2,3,4,5].every(d => days.includes(d))) return 'Weekdays';
    return days.map(day => dayNames[day]).join(', ');
  };

  const formatTimeWindow = (s?: string, e?: string) => (!s || !e) ? 'Not set' : `${s} - ${e}`;

  const formatDelay = (seconds: number = 0) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  const handlePause = async () => {
    try {
      const newStatus = currentStatus === 'paused' ? 'active' : 'paused';
      const { error } = await supabase.from('campaigns').update({ status: newStatus }).eq('id', campaign.id);
      if (error) throw error;
      setCurrentStatus(newStatus);
      toast({ title: `Campaign ${newStatus === 'paused' ? 'paused' : 'resumed'}` });
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Please try again", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.rpc('delete_campaign_with_data', { campaign_id_param: campaign.id });
      if (error) throw error;
      toast({ title: "Campaign deleted", description: "Campaign and all associated data have been permanently removed." });
      onDelete?.();
    } catch (error) {
      toast({ title: "Error deleting campaign", description: error instanceof Error ? error.message : "Please try again", variant: "destructive" });
    }
  };

  return (
    <div className="border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <span className={getStatusBadge(currentStatus)}>{currentStatus}</span>
          <h3 className="text-lg font-medium text-foreground">{campaign.campaign_name}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" onClick={() => navigate(`/client/${clientId}/campaigns/${campaign.id}`)}>
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          {currentStatus !== 'completed' && (
            <Button variant="outline" onClick={handlePause}>
              {currentStatus === 'paused' ? <><Play className="w-4 h-4 mr-1" />Resume</> : <><Pause className="w-4 h-4 mr-1" />Pause</>}
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{campaign.campaign_name}"? This will permanently remove the campaign and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete Campaign
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{campaign.total_leads} leads</span>
        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{formatLeadTime(campaign.created_at).split(' (')[0]}</span>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="text-foreground font-medium">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-accent h-1.5">
          <div className="bg-foreground h-1.5 transition-all duration-300" style={{ width: `${completionPercentage}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">{actualProcessedCount} of {campaign.total_leads} leads processed</p>
      </div>

      {/* Schedule */}
      <div className="border-t border-border pt-4 space-y-2">
        <p className="text-label flex items-center gap-1.5"><Settings className="w-3 h-3" />Schedule & Batch</p>
        <div className="grid grid-cols-1 gap-1.5 text-xs">
          {[
            { icon: AlarmClock, label: 'Time Window', value: formatTimeWindow(campaign.start_time, campaign.end_time) },
            { icon: Calendar, label: 'Active Days', value: formatDaysOfWeek(campaign.days_of_week) },
            { icon: Users, label: 'Batch Size', value: `${campaign.batch_size || 'N/A'} leads` },
            { icon: Timer, label: 'Batch Interval', value: `${campaign.batch_interval_minutes || 'N/A'} min` },
            { icon: Clock, label: 'Lead Delay', value: formatDelay(campaign.lead_delay_seconds) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground"><Icon className="w-3 h-3" />{label}</span>
              <span className="text-foreground font-medium">{value}</span>
            </div>
          ))}
          {campaign.timezone && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground"><Globe className="w-3 h-3" />Timezone</span>
              <span className="text-foreground font-medium">{campaign.timezone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignCard;
