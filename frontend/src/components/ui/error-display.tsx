import * as React from "react";
import { AlertCircle, ChevronDown, ChevronUp, Copy, Check, XCircle, AlertTriangle, Info } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";
import { Badge } from "./badge";

export interface ParsedError {
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  reason?: string;
  statusCode?: number;
  rawResponse?: string;
  timestamp?: string;
  suggestion?: string;
}

interface ErrorDisplayProps {
  error: ParsedError;
  className?: string;
  onDismiss?: () => void;
  showRawResponse?: boolean;
}

// Helper to parse various error formats into a standardized structure
export function parseBackendError(
  error: unknown,
  statusCode?: number,
  rawResponse?: string
): ParsedError {
  const timestamp = new Date().toISOString();
  
  // Handle string errors
  if (typeof error === 'string') {
    return {
      type: 'error',
      title: 'Error Occurred',
      message: error,
      statusCode,
      rawResponse,
      timestamp,
      suggestion: 'Please check your configuration and try again.'
    };
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    // Try to parse JSON error messages (some backends return JSON in error.message)
    try {
      const parsed = JSON.parse(error.message);
      return parseBackendError(parsed, statusCode, rawResponse);
    } catch {
      // Not JSON, use the message directly
      return {
        type: 'error',
        title: 'Request Failed',
        message: error.message,
        statusCode,
        rawResponse,
        timestamp,
        suggestion: getSuggestionForError(error.message, statusCode)
      };
    }
  }
  
  // Handle object errors (API responses)
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    
    // Common error response formats
    const message = 
      (err.error as string) || 
      (err.message as string) || 
      (err.detail as string) ||
      (err.errorMessage as string) ||
      ((err.data as Record<string, unknown>)?.message as string) ||
      'An unexpected error occurred';
    
    const reason = 
      (err.reason as string) || 
      (err.cause as string) ||
      (err.error_description as string) ||
      ((err.details as Record<string, unknown>)?.reason as string);
    
    const title = 
      (err.title as string) || 
      (err.name as string) ||
      (err.code as string) ||
      getErrorTitle(statusCode);
    
    return {
      type: err.type === 'warning' ? 'warning' : err.type === 'info' ? 'info' : 'error',
      title,
      message,
      reason,
      statusCode: (err.status as number) || (err.statusCode as number) || statusCode,
      rawResponse: rawResponse || (typeof err === 'object' ? JSON.stringify(err, null, 2) : undefined),
      timestamp,
      suggestion: (err.suggestion as string) || getSuggestionForError(message, statusCode)
    };
  }
  
  // Fallback for unknown error types
  return {
    type: 'error',
    title: 'Unknown Error',
    message: 'An unexpected error occurred',
    statusCode,
    rawResponse,
    timestamp,
    suggestion: 'Please try again or contact support if the issue persists.'
  };
}

function getErrorTitle(statusCode?: number): string {
  if (!statusCode) return 'Error';
  
  const titles: Record<number, string> = {
    400: 'Bad Request',
    401: 'Authentication Failed',
    403: 'Access Denied',
    404: 'Not Found',
    408: 'Request Timeout',
    429: 'Rate Limited',
    500: 'Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
  };
  
  return titles[statusCode] || `Error ${statusCode}`;
}

function getSuggestionForError(message: string, statusCode?: number): string {
  const lowerMessage = message.toLowerCase();
  
  // Authentication/Authorization errors
  if (statusCode === 401 || lowerMessage.includes('auth') || lowerMessage.includes('token') || lowerMessage.includes('jwt')) {
    return 'Check your API key or authentication credentials. The service key may be expired or invalid.';
  }
  
  if (statusCode === 403 || lowerMessage.includes('permission') || lowerMessage.includes('forbidden')) {
    return 'You may not have permission to access this resource. Check your RLS policies or user permissions.';
  }
  
  // Network/Connection errors
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('connect')) {
    return 'Check your internet connection and verify the webhook URL is correct and accessible.';
  }
  
  // Timeout errors
  if (statusCode === 408 || statusCode === 504 || lowerMessage.includes('timeout')) {
    return 'The request took too long. Try again or check if the backend service is responding slowly.';
  }
  
  // Rate limiting
  if (statusCode === 429 || lowerMessage.includes('rate') || lowerMessage.includes('limit')) {
    return 'Too many requests. Wait a moment before trying again.';
  }
  
  // Supabase specific
  if (lowerMessage.includes('supabase') || lowerMessage.includes('table') || lowerMessage.includes('relation')) {
    return 'Check your Supabase configuration. Verify the table name exists and the service key has access.';
  }
  
  // Webhook specific
  if (lowerMessage.includes('webhook')) {
    return 'The webhook may be misconfigured or unreachable. Verify the webhook URL in your settings.';
  }
  
  // JSON parsing
  if (lowerMessage.includes('json') || lowerMessage.includes('parse')) {
    return 'The response format was unexpected. The backend may be returning invalid data.';
  }
  
  // Default suggestions based on status code
  if (statusCode && statusCode >= 500) {
    return 'This is a server-side error. The backend service may be temporarily unavailable.';
  }
  
  if (statusCode && statusCode >= 400) {
    return 'Check your request parameters and configuration.';
  }
  
  return 'Please check your configuration and try again. If the issue persists, contact support.';
}

export function ErrorDisplay({ error, className, onDismiss, showRawResponse = true }: ErrorDisplayProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    const errorText = `
Error: ${error.title}
Message: ${error.message}
${error.reason ? `Reason: ${error.reason}` : ''}
${error.statusCode ? `Status Code: ${error.statusCode}` : ''}
${error.timestamp ? `Time: ${error.timestamp}` : ''}
${error.rawResponse ? `\nRaw Response:\n${error.rawResponse}` : ''}
    `.trim();

    await navigator.clipboard.writeText(errorText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const Icon = error.type === 'warning' ? AlertTriangle : error.type === 'info' ? Info : XCircle;
  
  const colors = {
    error: {
      border: 'border-destructive/50',
      bg: 'bg-destructive/5',
      icon: 'text-destructive',
      badge: 'bg-destructive/10 text-destructive border-destructive/30'
    },
    warning: {
      border: 'border-yellow-500/50',
      bg: 'bg-yellow-500/5',
      icon: 'text-yellow-600',
      badge: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30'
    },
    info: {
      border: 'border-blue-500/50',
      bg: 'bg-blue-500/5',
      icon: 'text-blue-600',
      badge: 'bg-blue-500/10 text-blue-700 border-blue-500/30'
    }
  };

  const colorScheme = colors[error.type];

  return (
    <Card className={cn(
      "overflow-hidden",
      colorScheme.border,
      colorScheme.bg,
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-lg", colorScheme.bg)}>
              <Icon className={cn("w-5 h-5", colorScheme.icon)} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  {error.title}
                </CardTitle>
                {error.statusCode && (
                  <Badge variant="outline" className={cn("text-xs", colorScheme.badge)}>
                    {error.statusCode}
                  </Badge>
                )}
              </div>
              <CardDescription className="text-sm text-foreground/80">
                {error.message}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={copyToClipboard}
              title="Copy error details"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onDismiss}
                title="Dismiss"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* Reason */}
        {error.reason && (
          <div className="text-sm">
            <span className="font-medium text-muted-foreground">Reason: </span>
            <span className="text-foreground/80">{error.reason}</span>
          </div>
        )}
        
        {/* Suggestion */}
        {error.suggestion && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Suggestion: </span>
                {error.suggestion}
              </p>
            </div>
          </div>
        )}
        
        {/* Raw Response (collapsible) */}
        {showRawResponse && error.rawResponse && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-muted-foreground hover:text-foreground"
              >
                <span className="text-xs">View raw response</span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="mt-2 p-3 rounded-lg bg-muted text-xs overflow-x-auto max-h-48 overflow-y-auto font-mono text-muted-foreground border border-border">
                {error.rawResponse}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {/* Timestamp */}
        {error.timestamp && (
          <p className="text-xs text-muted-foreground/60">
            Occurred at: {new Date(error.timestamp).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Compact inline error for smaller spaces
interface InlineErrorProps {
  error: ParsedError;
  className?: string;
  onDismiss?: () => void;
}

export function InlineError({ error, className, onDismiss }: InlineErrorProps) {
  const Icon = error.type === 'warning' ? AlertTriangle : error.type === 'info' ? Info : AlertCircle;
  
  const colors = {
    error: 'text-destructive bg-destructive/10 border-destructive/30',
    warning: 'text-yellow-700 bg-yellow-500/10 border-yellow-500/30',
    info: 'text-blue-700 bg-blue-500/10 border-blue-500/30'
  };

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm",
      colors[error.type],
      className
    )}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{error.message}</span>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-transparent"
          onClick={onDismiss}
        >
          <XCircle className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
