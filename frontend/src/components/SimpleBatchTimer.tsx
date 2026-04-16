import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Timer, Zap } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatInTimeZone } from 'date-fns-tz';

interface SimpleBatchTimerProps {
  campaignId: string;
  campaignStatus: string;
}

interface TimerData {
  nextBatchTime: Date | null;
  lastBatchTime: Date | null;
  batchInterval: number;
  leadDelay: number;
  timeRemaining: string;
  progressPercentage: number;
  isProcessing: boolean;
}

const SimpleBatchTimer: React.FC<SimpleBatchTimerProps> = ({ 
  campaignId, 
  campaignStatus 
}) => {
  const [timerData, setTimerData] = useState<TimerData>({
    nextBatchTime: null,
    lastBatchTime: null,
    batchInterval: 15,
    leadDelay: 5,
    timeRemaining: 'Loading...',
    progressPercentage: 0,
    isProcessing: false
  });
  const [isLoading, setIsLoading] = useState(true);

  const calculateProgress = useCallback((
    nextBatch: Date | null,
    lastBatch: Date | null,
    interval: number
  ): number => {
    if (!nextBatch || !lastBatch) return 0;

    const now = new Date();
    const intervalMs = interval * 60 * 1000;
    
    // Calculate expected next batch time based on last batch + interval
    const expectedNextBatch = new Date(lastBatch.getTime() + intervalMs);
    
    // Time elapsed since last batch
    const timeSinceLastBatch = now.getTime() - lastBatch.getTime();
    
    // Progress as percentage of interval (capped at 100%)
    const progress = Math.min(100, Math.max(0, (timeSinceLastBatch / intervalMs) * 100));
    
    return progress;
  }, []);

  const fetchTimerData = useCallback(async () => {
    try {
      // Get campaign settings
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('batch_interval_minutes, lead_delay_seconds')
        .eq('id', campaignId)
        .single();

      if (!campaign) return;

      // Check if currently processing
      const { data: processingLeads } = await supabase
        .from('campaign_leads')
        .select('id')
        .eq('campaign_id', campaignId)
        .in('status', ['processing', 'batch_processing'])
        .limit(1);

      const isProcessing = processingLeads && processingLeads.length > 0;

      // Get next scheduled batch
      const { data: nextLead } = await supabase
        .from('campaign_leads')
        .select('scheduled_for')
        .eq('campaign_id', campaignId)
        .eq('status', 'pending')
        .order('scheduled_for', { ascending: true })
        .limit(1);

      // Get last batch completion time
      const { data: lastBatch } = await supabase
        .from('execution_logs')
        .select('execution_time, webhook_response')
        .eq('campaign_id', campaignId)
        .eq('status', 'BATCH_COMPLETED')
        .order('execution_time', { ascending: false })
        .limit(1);

      let lastBatchTime: Date | null = null;
      if (lastBatch?.[0]) {
        try {
          const response = JSON.parse(lastBatch[0].webhook_response || '{}');
          lastBatchTime = response.execution_time ? 
            new Date(response.execution_time) : 
            new Date(lastBatch[0].execution_time);
        } catch {
          lastBatchTime = new Date(lastBatch[0].execution_time);
        }
      }

      // Calculate the correct next batch time based on batch interval
      let correctedNextBatchTime = nextLead?.[0]?.scheduled_for ? 
        new Date(nextLead[0].scheduled_for) : null;
      
      // If we have a last batch time, ensure next batch respects the interval
      if (lastBatchTime && campaign.batch_interval_minutes) {
        const intervalMs = campaign.batch_interval_minutes * 60 * 1000;
        const expectedNextBatch = new Date(lastBatchTime.getTime() + intervalMs);
        
        // Use the later of the two times to ensure we respect the interval
        if (correctedNextBatchTime) {
          correctedNextBatchTime = new Date(Math.max(
            correctedNextBatchTime.getTime(),
            expectedNextBatch.getTime()
          ));
        } else {
          correctedNextBatchTime = expectedNextBatch;
        }
      }

      setTimerData({
        nextBatchTime: correctedNextBatchTime,
        lastBatchTime,
        batchInterval: campaign.batch_interval_minutes || 15,
        leadDelay: campaign.lead_delay_seconds || 5,
        timeRemaining: 'Calculating...',
        progressPercentage: calculateProgress(correctedNextBatchTime, lastBatchTime, campaign.batch_interval_minutes || 15),
        isProcessing
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching timer data:', error);
      setIsLoading(false);
    }
  }, [campaignId, calculateProgress]);

  // Update time remaining every second
  useEffect(() => {
    if (!timerData.nextBatchTime || campaignStatus !== 'active') return;

    const updateTimer = () => {
      const now = new Date();
      const timeDiff = timerData.nextBatchTime!.getTime() - now.getTime();

      if (timeDiff <= 0) {
        setTimerData(prev => ({ ...prev, timeRemaining: 'Scheduled for Execution' }));
      } else {
        const totalSeconds = Math.floor(timeDiff / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        let timeString = '';
        if (hours > 0) {
          timeString = `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
          timeString = `${minutes}m ${seconds}s`;
        } else {
          timeString = `${seconds}s`;
        }

        const progress = calculateProgress(
          timerData.nextBatchTime,
          timerData.lastBatchTime,
          timerData.batchInterval
        );

        setTimerData(prev => ({
          ...prev,
          timeRemaining: timeString,
          progressPercentage: Math.round(progress)
        }));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [timerData.nextBatchTime, timerData.lastBatchTime, timerData.batchInterval, campaignStatus, calculateProgress]);

  // Fetch data every 10 seconds and listen for real-time updates
  useEffect(() => {
    fetchTimerData();
    
    const interval = setInterval(fetchTimerData, 10000);
    
    // Real-time subscriptions
    const channel = supabase
      .channel(`timer-${campaignId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads',
        filter: `campaign_id=eq.${campaignId}`
      }, fetchTimerData)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'execution_logs',
        filter: `campaign_id=eq.${campaignId}`
      }, fetchTimerData)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [campaignId, fetchTimerData]);

  const getStatusIcon = () => {
    if (campaignStatus === 'completed') return <Zap className="w-4 sm:w-5 h-4 sm:h-5 text-green-600" />;
    if (timerData.isProcessing) return <Timer className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600 animate-pulse" />;
    return <Clock className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />;
  };

  const getTimerColor = () => {
    if (campaignStatus === 'paused') return 'text-yellow-600';
    if (campaignStatus === 'completed') return 'text-green-600';
    if (timerData.isProcessing) return 'text-blue-600';
    if (timerData.timeRemaining.includes('Scheduled')) return 'text-orange-600';
    
    // Color based on urgency
    if (timerData.timeRemaining.includes('s') && !timerData.timeRemaining.includes('m')) {
      const seconds = parseInt(timerData.timeRemaining.split('s')[0]);
      if (seconds <= 30) return 'text-red-600';
      if (seconds <= 60) return 'text-orange-600';
    }
    
    return 'text-primary';
  };

  if (isLoading) {
    return (
      <Card className="bg-card border border-border">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading batch timer...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border border-border hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-4 sm:w-5 h-4 sm:h-5 text-primary">
              {getStatusIcon()}
            </div>
            <span className="text-sm sm:text-base font-semibold">Batch Timer</span>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-sm px-3 py-1">
            {campaignStatus === 'paused' ? 'Paused' : 
             campaignStatus === 'completed' ? 'Completed' : 
             timerData.isProcessing ? 'Processing' : 'Active'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Timer Display */}
        <div className="text-center space-y-3">
          <div className={`text-4xl font-mono font-bold ${getTimerColor()}`}>
            {campaignStatus === 'paused' ? 'Campaign Paused' :
             campaignStatus === 'completed' ? 'All Leads Completed' :
             timerData.isProcessing ? 'Processing Leads...' :
             timerData.timeRemaining.includes('Scheduled') ? 'Next Execution Scheduled' :
             timerData.timeRemaining}
          </div>
          
          {timerData.nextBatchTime && campaignStatus === 'active' && !timerData.isProcessing && (
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Next batch scheduled for:</p>
              <p className="text-sm sm:text-base font-semibold text-foreground">
                {formatInTimeZone(timerData.nextBatchTime, 'America/New_York', 'MM/dd/yyyy')} at {formatInTimeZone(timerData.nextBatchTime, 'America/New_York', 'hh:mm:ss a')} ET
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar - only show when waiting for next batch */}
        {campaignStatus === 'active' && !timerData.isProcessing && timerData.nextBatchTime && timerData.lastBatchTime && (
          <div className="space-y-3">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Batch Interval Progress</span>
              <span className="font-semibold text-primary">{timerData.progressPercentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-primary to-primary/80 h-full rounded-full transition-all duration-1000 shadow-sm"
                style={{ width: `${Math.max(0, Math.min(100, timerData.progressPercentage))}%` }}
              />
            </div>
          </div>
        )}

        {/* Settings Info - Only show batch interval */}
        {campaignStatus === 'active' && (
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Timer className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
              <div>
                <span className="text-xs sm:text-sm font-medium text-foreground">Batch Interval</span>
                <p className="text-xl sm:text-2xl font-bold text-primary">{timerData.batchInterval} minutes</p>
              </div>
            </div>
          </div>
        )}

        {/* Status Indicator */}
        <div className="flex justify-center pt-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${
              timerData.isProcessing ? 'bg-blue-500 animate-pulse' : 
              campaignStatus === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`} />
            <span>
              {timerData.isProcessing ? 'Executing batch now' :
               campaignStatus === 'active' ? 'Monitoring for execution' :
               campaignStatus === 'paused' ? 'Campaign paused' : 'Campaign completed'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleBatchTimer;