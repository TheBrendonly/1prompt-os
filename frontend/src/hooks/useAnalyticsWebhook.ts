import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { parseBackendError, type ParsedError } from '@/components/ui/error-display';

export interface MetricDefinition {
  id?: string;
  name: string;
  prompt: string;
  color?: string;
  widget_type?: string;
  description?: string;
}

interface AnalyticsWebhookPayload {
  clientId: string;
  timeRange: string;
  triggerType: 'auto-refresh' | 'manual' | 'custom-metric';
  timestamp: string;
  defaultMetrics: MetricDefinition[];
  customMetrics: MetricDefinition[];
  supabase_url: string | null;
  supabase_service_key: string | null;
  supabase_table_name: string | null;
  analyticsType: 'text' | 'voice';
  startDate?: string;
  endDate?: string;
}

export interface AnalyticsWebhookResult {
  success: boolean;
  data: any | null;
  error?: ParsedError;
}

const defaultTextMetrics: MetricDefinition[] = [
  {
    name: "Total Conversations",
    prompt: "Count the total number of distinct conversation sessions. Each unique conversation thread or session should be counted once."
  },
  {
    name: "Total Bot Messages",
    prompt: "Count all messages in the chat history where the role is 'assistant', 'bot', or similar. Include any automated responses."
  },
  {
    name: "Total Human Messages",
    prompt: "Count all messages sent by human users in the chat history."
  },
  {
    name: "New Users", 
    prompt: "Identify unique users in the chat history and count users who appear to be new or first-time users based on conversation patterns."
  }
];

const defaultVoiceMetrics: MetricDefinition[] = [
  {
    name: "New User Messages", 
    prompt: "Identify unique users in the voice call transcripts and count messages from users who appear to be new or first-time callers based on conversation patterns."
  },
  {
    name: "Thank You Count",
    prompt: "Count instances where users express gratitude, thanks, appreciation, or similar positive acknowledgments in voice transcripts. Look for words like 'thank you', 'thanks', 'grateful', 'appreciate', etc."
  },
  {
    name: "Questions Asked",
    prompt: "Count all user messages in voice transcripts that contain questions. Look for question marks, interrogative words (who, what, when, where, why, how), and question patterns."
  },
  {
    name: "Total Voice Call",
    prompt: "Count the total number of distinct voice call sessions. Each unique voice call or session should be counted once."
  }
];

// Status → human-readable stage descriptions
const STATUS_LABELS: Record<string, string> = {
  pending: "Starting...",
  running: "Running...",
  fetching_data: "Fetching chat history...",
  analyzing: "Analyzing messages...",
  calling_ai: "Computing custom metrics with AI...",
};

const POLL_INTERVAL_MS = 2500;
const MAX_POLL_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export const useAnalyticsWebhook = (clientId: string, analyticsType: 'text' | 'voice' = 'text') => {
  const [sending, setSending] = useState(false);
  const [lastError, setLastError] = useState<ParsedError | null>(null);
  const [stageDescription, setStageDescription] = useState<string | null>(null);
  const { toast } = useToast();
  const abortRef = useRef(false);

  const clearError = () => setLastError(null);

  const pollExecution = useCallback(async (
    executionId: string,
    context?: { timeRange: string; analyticsType: 'text' | 'voice' }
  ): Promise<{ success: boolean; data: any | null; error?: ParsedError }> => {
    const startTime = Date.now();
    abortRef.current = false;

    while (Date.now() - startTime < MAX_POLL_DURATION_MS) {
      if (abortRef.current) {
        return { success: false, data: null, error: parseBackendError({ message: "Aborted" }) };
      }

      const { data: exec, error: execError } = await supabase
        .from('analytics_executions')
        .select('status, stage_description, error_message')
        .eq('id', executionId)
        .maybeSingle();

      if (execError) {
        console.error("Poll error:", execError);
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
        continue;
      }

      const status = (exec as any)?.status || 'pending';
      const stage = (exec as any)?.stage_description || STATUS_LABELS[status] || status;
      setStageDescription(stage);

      if (status === 'completed') {
        // Fetch results
        const { data: results, error: resultsError } = await supabase
          .from('analytics_results')
          .select('widgets, default_metrics, summary, conversations_list')
          .eq('execution_id', executionId)
          .maybeSingle();

        if (resultsError || !results) {
          console.error("Failed to fetch analytics results:", resultsError);
          return {
            success: false,
            data: null,
            error: parseBackendError(resultsError || { message: "Results not found" }),
          };
        }

        const resultData = {
          widgets: (results as any).widgets,
          default_metrics: (results as any).default_metrics,
          summary: (results as any).summary,
          conversations_list: (results as any).conversations_list,
          Conversations_List: (results as any).conversations_list,
        };

        // If widgets are empty, custom metrics are still processing in background.
        // Schedule a delayed re-fetch to pick them up.
        const widgetArr = resultData.widgets;
        if ((!widgetArr || (Array.isArray(widgetArr) && widgetArr.length === 0))) {
          // Fire a background poll for custom metric widgets (non-blocking)
          setTimeout(async () => {
            for (let attempt = 0; attempt < 8; attempt++) {
              await new Promise(r => setTimeout(r, 5000)); // wait 5s between checks
              const { data: updated } = await supabase
                .from('analytics_results')
                .select('widgets')
                .eq('execution_id', executionId)
                .maybeSingle();
              const updatedWidgets = (updated as any)?.widgets;
              if (updatedWidgets && Array.isArray(updatedWidgets) && updatedWidgets.length > 0) {
                console.log(`Custom metrics arrived (${updatedWidgets.length} widgets) for execution ${executionId}`);
                // Dispatch event so ChatAnalytics can pick up updated widgets
                window.dispatchEvent(new CustomEvent('analyticsWidgetsUpdated', {
                  detail: {
                    executionId,
                    widgets: updatedWidgets,
                    analyticsType: context?.analyticsType,
                    timeRange: context?.timeRange,
                  },
                }));
                break;
              }
            }
          }, 2000);
        }

        // Return data in the same shape the old n8n webhook returned
        return { success: true, data: resultData };
      }

      if (status === 'failed') {
        const errorMsg = (exec as any)?.error_message || 'Analytics computation failed';
        return {
          success: false,
          data: null,
          error: parseBackendError({ message: errorMsg }),
        };
      }

      // Still processing — wait and poll again
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    }

    // Timed out
    return {
      success: false,
      data: null,
      error: parseBackendError({ message: "Analytics computation timed out after 10 minutes" }),
    };
  }, []);

  const sendAnalyticsToWebhook = async (
    timeRange: string,
    triggerType: 'auto-refresh' | 'manual' | 'custom-metric',
    customMetrics: MetricDefinition[] = [],
    dateRange?: { startDate: string; endDate: string }
  ): Promise<AnalyticsWebhookResult> => {
    if (!clientId) return { success: false, data: null };
    
    // Clear previous error
    setLastError(null);
    setStageDescription(null);
    
    // Block auto-refresh requests - only allow manual and custom-metric triggers
    if (triggerType === 'auto-refresh') {
      console.warn('Auto-refresh requests are disabled. Use manual refresh instead.');
      return { success: false, data: null };
    }

    setSending(true);
    try {
      const metricsToSend = analyticsType === 'voice' ? defaultVoiceMetrics : defaultTextMetrics;

      // Step 1: Call the run-analytics edge function
      const edgeFnPayload = {
        clientId,
        timeRange,
        startDate: dateRange?.startDate || null,
        endDate: dateRange?.endDate || null,
        defaultMetrics: metricsToSend,
        customMetrics,
        analyticsType,
      };

      console.log(`Calling run-analytics edge function (${analyticsType}):`, edgeFnPayload);

      const { data: edgeFnResult, error: edgeFnError } = await supabase.functions.invoke('run-analytics', {
        body: edgeFnPayload,
      });

      if (edgeFnError) {
        const parsedError = parseBackendError(edgeFnError);
        setLastError(parsedError);
        
        if (triggerType === 'manual') {
          toast({
            title: parsedError.title,
            description: parsedError.message,
            variant: "destructive",
          });
        }
        
        return { success: false, data: null, error: parsedError };
      }

      const executionId = edgeFnResult?.execution_id;
      if (!executionId) {
        const parsedError = parseBackendError({ message: "Edge function did not return execution_id" });
        setLastError(parsedError);
        return { success: false, data: null, error: parsedError };
      }

      console.log(`Analytics execution created: ${executionId}, polling for results...`);
      setStageDescription(STATUS_LABELS.pending);

      // Step 2: Poll for completion
      const result = await pollExecution(executionId, { timeRange, analyticsType });

      if (!result.success) {
        setLastError(result.error || null);
        
        if (triggerType === 'manual' && result.error) {
          toast({
            title: result.error.title,
            description: result.error.message,
            variant: "destructive",
          });
        }
        
        return result;
      }

      console.log('Analytics computation completed. Data:', result.data);
      
      if (triggerType === 'manual') {
        toast({
          title: "Analytics Sent",
          description: "Analytics data successfully computed",
        });
      }

      // Log the request
      try {
        await supabase.from('request_logs').insert({
          client_id: clientId,
          request_type: 'edge_function',
          source: analyticsType === 'voice' ? 'voice-analytics-trigger' : 'text-analytics-trigger',
          endpoint_url: 'run-analytics',
          method: 'POST',
          request_body: edgeFnPayload as any,
          response_body: { execution_id: executionId, status: 'completed' } as any,
          status_code: 200,
          status: 'success',
          duration_ms: 0,
          metadata: {} as any,
        });
      } catch (logErr) {
        console.error('Failed to log request:', logErr);
      }

      return result;
    } catch (error) {
      console.error('Error in analytics pipeline:', error);
      
      const parsedError = parseBackendError(error);
      setLastError(parsedError);
      
      if (triggerType === 'manual') {
        toast({
          title: parsedError.title,
          description: parsedError.message,
          variant: "destructive",
        });
      }
      
      return { success: false, data: null, error: parsedError };
    } finally {
      setSending(false);
      setStageDescription(null);
    }
  };

  return {
    sendAnalyticsToWebhook,
    sending,
    lastError,
    clearError,
    stageDescription,
  };
};
