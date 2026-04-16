import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Play, Clock, CheckCircle, XCircle, Download, RotateCcw } from '@/components/icons';
import { formatLeadTime, formatScheduledTime } from '@/utils/timeUtils';

interface Lead {
  id: string;
  campaign_id: string;
  lead_data: any;
  status: string;
  processed_at: string | null;
  error_message: string | null;
  scheduled_for: string | null;
}

interface LeadRowProps {
  lead: Lead;
  campaignWebhookUrl: string;
  campaignName: string;
  campaignNotes: string | null;
  onLeadUpdate: () => void;
  delayFromPrevious?: number; // Delay in seconds from previous lead execution
  leadNumber?: number; // Position number of the lead in the list
}

const LeadRow: React.FC<LeadRowProps> = ({ 
  lead, 
  campaignWebhookUrl, 
  campaignName, 
  campaignNotes, 
  onLeadUpdate,
  delayFromPrevious,
  leadNumber 
}) => {
  const { toast } = useToast();
  const [executing, setExecuting] = useState(false);
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badgeVariants: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      processing: "bg-blue-100 text-blue-800 border-blue-300 animate-pulse",
      completed: "bg-green-100 text-green-800 border-green-300",
      failed: "bg-destructive/10 text-destructive border-destructive/30"
    };

    return (
      <Badge variant="outline" className={badgeVariants[status] || badgeVariants.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getScheduledTimeDisplay = () => {
    if (lead.status === 'completed' && lead.processed_at) {
      return `Completed: ${formatLeadTime(lead.processed_at)}`;
    }
    if (lead.status === 'failed' && lead.processed_at) {
      return `Failed: ${formatLeadTime(lead.processed_at)}`;
    }
    if (lead.status === 'pending') {
      return 'Scheduled';
    }
    return 'Not scheduled';
  };

  const downloadLeadAsCSV = () => {
    const csvContent = Object.entries(lead.lead_data)
      .map(([key, value]) => `${key},${value}`)
      .join('\n');
    
    const header = 'Field,Value\n';
    const fullCSV = header + csvContent;
    
    const blob = new Blob([fullCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `lead_${lead.id}_data.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const executeLeadManually = async () => {
    setExecuting(true);
    try {
      console.log('Executing lead manually:', lead.id);
      
      // Update lead status to processing
      const { error: updateError } = await supabase
        .from('campaign_leads')
        .update({ status: 'processing' })
        .eq('id', lead.id);

      if (updateError) {
        console.error('Error updating lead status:', updateError);
        toast({
          title: "Error",
          description: "Failed to update lead status",
          variant: "destructive",
        });
        return;
      }

      // Load client Supabase config for this campaign
      const { data: campaignWithClient, error: clientCfgError } = await supabase
        .from('campaigns')
        .select('client_id, clients(supabase_url, supabase_service_key, supabase_table_name, database_reactivation_inbound_webhook_url)')
        .eq('id', lead.campaign_id)
        .single();

      if (clientCfgError) {
        console.warn('Could not load client Supabase config:', clientCfgError.message);
      }

      const clientSupabaseConfig = (campaignWithClient as any)?.clients || {};

      // Call the webhook
      const webhookData = {
        leadData: lead.lead_data,
        campaignName: campaignName,
        reactivationNotes: campaignNotes || '',
        leadId: lead.id,
        campaignId: lead.campaign_id,
        scheduledFor: lead.scheduled_for,
        processedAt: new Date().toISOString(),
        supabase_url: clientSupabaseConfig?.supabase_url || null,
        supabase_service_key: clientSupabaseConfig?.supabase_service_key || null,
        supabase_table_name: clientSupabaseConfig?.supabase_table_name || null,
        database_reactivation_inbound_webhook_url: clientSupabaseConfig?.database_reactivation_inbound_webhook_url || null,
      };

      console.log('Calling webhook:', campaignWebhookUrl);
      console.log('Webhook data:', webhookData);

      const response = await fetch(campaignWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });

      console.log('Webhook response status:', response.status);
      const responseText = await response.text();
      console.log('Webhook response:', responseText);

      if (response.ok) {
        // Update lead status to completed
        const { error: completedError } = await supabase
          .from('campaign_leads')
          .update({ 
            status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('id', lead.id);

        if (completedError) {
          console.error('Error updating lead to completed:', completedError);
        } else {
          console.log('Lead marked as completed');
          onLeadUpdate();
          toast({
            title: "Success",
            description: "Lead executed successfully",
          });
        }
      } else {
        throw new Error(`Webhook failed with status ${response.status}`);
      }
    } catch (error: any) {
      console.error('Error executing lead:', error);
      
      // Update lead status to failed
      const { error: failedError } = await supabase
        .from('campaign_leads')
        .update({ 
          status: 'failed',
          error_message: error.message,
          processed_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      if (failedError) {
        console.error('Error updating lead to failed:', failedError);
      }

      onLeadUpdate();
      toast({
        title: "Error",
        description: `Failed to execute lead: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setExecuting(false);
    }
  };

  const retryLead = async () => {
    try {
      // Reset lead to pending status and clear error
      const { error } = await supabase
        .from('campaign_leads')
        .update({ 
          status: 'pending',
          error_message: null,
          processed_at: null,
          scheduled_for: new Date().toISOString() // Reschedule to now
        })
        .eq('id', lead.id);

      if (error) {
        console.error('Error retrying lead:', error);
        toast({
          title: "Error",
          description: "Failed to retry lead",
          variant: "destructive",
        });
        return;
      }

      onLeadUpdate();
      toast({
        title: "Success",
        description: "Lead reset and rescheduled for immediate execution",
      });
    } catch (error: any) {
      console.error('Error retrying lead:', error);
      toast({
        title: "Error",
        description: `Failed to retry lead: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const getLeadDisplayName = (leadData: any) => {
    // Try different possible name field combinations
    const firstName = leadData?.['First name'] || 
                     leadData?.['first_name'] || 
                     leadData?.['firstName'] || 
                     leadData?.['First Name'];
    
    const lastName = leadData?.['Last name'] || 
                    leadData?.['last_name'] || 
                    leadData?.['lastName'] || 
                    leadData?.['Last Name'];
    
    const fullName = leadData?.['name'] || leadData?.['Name'] || leadData?.['full_name'];
    
    // Try different possible email field names
    const email = leadData?.['Email Address'] || 
                  leadData?.['email'] || 
                  leadData?.['Email'] || 
                  leadData?.['email_address'];
    
    // Construct display name
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (fullName) {
      return fullName;
    } else if (email) {
      return email;
    } else {
      return 'Unknown Lead';
    }
  };

  const formatLeadData = (leadData: any) => {
    const displayData = [];
    
    // Always show email if available
    const email = leadData?.['Email Address'] || leadData?.['email'] || leadData?.['Email'];
    if (email) displayData.push(`Email: ${email}`);
    
    // Show company name
    const company = leadData?.['Company name'] || leadData?.['company'] || leadData?.['Company'];
    if (company) displayData.push(`Company: ${company}`);
    
    // Show phone number
    const phone = leadData?.['Phone Number'] || leadData?.['phone'] || leadData?.['Phone'];
    if (phone) displayData.push(`Phone: ${phone}`);
    
    // Show website
    const website = leadData?.['Website url'] || leadData?.['website'] || leadData?.['Website'];
    if (website) displayData.push(`Website: ${website}`);
    
    return displayData.slice(0, 3); // Limit to 3 key fields
  };

  const formatDelay = (seconds: number) => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const remainingMinutes = Math.floor((seconds % 3600) / 60);
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
  };

  const getDelayDisplay = () => {
    if (delayFromPrevious !== undefined && delayFromPrevious > 0 && (lead.status === 'completed' || lead.status === 'failed')) {
      const delayColor = delayFromPrevious <= 10 ? 'text-green-600' : 
                       delayFromPrevious <= 30 ? 'text-yellow-600' : 'text-red-600';
      return (
        <div className={`text-xs ${delayColor} font-medium`}>
          ⏱️ +{formatDelay(delayFromPrevious)} from previous
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-all duration-200 mb-3">
      {/* Mobile Layout - Stack vertically */}
      <div className="block sm:hidden space-y-3">
        {/* Lead Name and Info */}
        <div>
          <h3 className="font-semibold text-gray-900 text-base mb-2">
            {leadNumber && <span className="text-sm text-gray-500 mr-2">#{leadNumber}</span>}
            {getLeadDisplayName(lead.lead_data)}
          </h3>
          <div className="space-y-1">
            {formatLeadData(lead.lead_data).map((item, index) => (
              <div key={index} className="text-sm text-gray-600">
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Status and Schedule Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(lead.status)}
            {getStatusBadge(lead.status)}
          </div>
          
          <div className="text-xs text-gray-500 text-right">
            {getScheduledTimeDisplay()}
            {getDelayDisplay()}
          </div>
        </div>

        {/* Action Buttons - Full width on mobile */}
        <div className="pt-2 flex gap-2">
          {lead.status === 'pending' && (
            <Button
              size="sm"
              variant="outline"
              onClick={executeLeadManually}
              disabled={executing}
              className="flex-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-medium"
            >
              <Play className="w-4 h-4 mr-2" />
              {executing ? 'Processing...' : 'Execute'}
            </Button>
          )}
          {lead.status === 'failed' && (
            <Button
              size="sm"
              variant="outline"
              onClick={retryLead}
              className="flex-1 bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 font-medium"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={downloadLeadAsCSV}
            className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Desktop Layout - Grid */}
      <div className="hidden sm:grid grid-cols-12 gap-4 items-center">
        {/* Lead Information - Takes 6 columns */}
        <div className="col-span-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 text-base">
              {leadNumber && <span className="text-sm text-gray-500 mr-2">#{leadNumber}</span>}
              {getLeadDisplayName(lead.lead_data)}
            </h3>
            <div className="space-y-1">
              {formatLeadData(lead.lead_data).map((item, index) => (
                <div key={index} className="text-sm text-gray-600">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Schedule Info - Takes 2 columns */}
        <div className="col-span-2">
          <div className="text-xs text-gray-500">
            {getScheduledTimeDisplay()}
            {getDelayDisplay()}
          </div>
        </div>

        {/* Status Badge - Takes 2 columns */}
        <div className="col-span-2 flex justify-center">
          <div className="flex items-center space-x-2">
            {getStatusIcon(lead.status)}
            {getStatusBadge(lead.status)}
          </div>
        </div>

        {/* Action Buttons - Takes 2 columns */}
        <div className="col-span-2 flex justify-end gap-2">
          {lead.status === 'pending' && (
            <Button
              size="sm"
              variant="outline"
              onClick={executeLeadManually}
              disabled={executing}
              className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-medium"
            >
              <Play className="w-3 h-3 mr-1" />
              {executing ? 'Processing...' : 'Execute'}
            </Button>
          )}
          {lead.status === 'failed' && (
            <Button
              size="sm"
              variant="outline"
              onClick={retryLead}
              className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 font-medium"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={downloadLeadAsCSV}
            className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
          >
            <Download className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      {/* Error Message - Full width within main card */}
      {lead.error_message && (
        <div className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <div className="text-sm text-destructive">
            <strong>Error:</strong> {lead.error_message}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadRow;