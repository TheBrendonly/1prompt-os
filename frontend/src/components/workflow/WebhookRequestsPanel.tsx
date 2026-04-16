import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RefreshCw, Check, ChevronLeft, Maximize2 } from '@/components/icons';
import { toast } from 'sonner';

interface WebhookRequest {
  id: string;
  raw_request: any;
  received_at: string;
}

interface WebhookRequestsPanelProps {
  workflowId: string;
  clientId: string;
  savedReference: any | null;
  onSaveReference: (reference: any) => void;
}

const fieldStyle = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' } as const;
const headerStyle = { fontFamily: "'VT323', monospace", fontSize: '18px' } as const;
const PAGE_SIZE = 10;
const VISIBLE_COUNT = 4;

export default function WebhookRequestsPanel({ workflowId, clientId, savedReference, onSaveReference }: WebhookRequestsPanelProps) {
  const [requests, setRequests] = useState<WebhookRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<WebhookRequest | null>(null);
  const [expandedJson, setExpandedJson] = useState(false);
  const [activeReferenceId, setActiveReferenceId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Determine which request is the active reference
  useEffect(() => {
    if (!savedReference) {
      setActiveReferenceId(null);
      return;
    }
    const refStr = JSON.stringify(savedReference);
    const match = requests.find(r => JSON.stringify(r.raw_request) === refStr);
    setActiveReferenceId(match?.id || null);
  }, [savedReference, requests]);

  const fetchRequests = useCallback(async (reset = true) => {
    setLoading(true);
    const offset = reset ? 0 : requests.length;

    const { data, error } = await (supabase as any)
      .from('workflow_webhook_requests')
      .select('id, raw_request, received_at')
      .eq('workflow_id', workflowId)
      .order('received_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      toast.error('Failed to fetch requests');
    } else {
      const fetched = data || [];
      if (reset) {
        setRequests(fetched);
      } else {
        setRequests(prev => [...prev, ...fetched]);
      }
      setHasMore(fetched.length === PAGE_SIZE);
    }
    setLoading(false);
  }, [workflowId, requests.length]);

  useEffect(() => {
    fetchRequests(true);
  }, [workflowId]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || loading || !hasMore) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (nearBottom) {
      fetchRequests(false);
    }
  }, [loading, hasMore, fetchRequests]);

  const handleSave = (request: WebhookRequest) => {
    onSaveReference(request.raw_request);
    setActiveReferenceId(request.id);
    toast.success('Mapping reference saved');
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return iso;
    }
  };

  // Detail view for a selected request
  if (selectedRequest) {
    const isActive = activeReferenceId === selectedRequest.id;
    const jsonContent = JSON.stringify(selectedRequest.raw_request, null, 2);

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <button
            className="groove-btn !h-7 !w-7 !p-0 !min-h-[28px] !min-w-[28px] flex items-center justify-center"
            onClick={() => setSelectedRequest(null)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-foreground capitalize" style={fieldStyle}>Request Detail</span>
        </div>
        <div className="text-muted-foreground" style={fieldStyle}>
          {formatTime(selectedRequest.received_at)}
        </div>
        <div className="relative">
          <div className="groove-border p-2 mt-1 overflow-auto max-h-[300px]">
            <pre className="text-foreground whitespace-pre-wrap break-all" style={fieldStyle}>
              {jsonContent}
            </pre>
          </div>
          <button
            className="groove-btn !h-8 !w-8 !p-0 !min-h-[32px] !min-w-[32px] flex items-center justify-center absolute bottom-2 right-2"
            onClick={() => setExpandedJson(true)}
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <Button
          type="button"
          onClick={() => handleSave(selectedRequest)}
          disabled={isActive}
          className="w-full groove-btn gap-2"
          style={headerStyle}
        >
          <Check className="w-4 h-4" />
          {isActive ? 'SAVED AS REFERENCE' : 'SAVE AS MAPPING REFERENCE'}
        </Button>

        {/* Expand dialog */}
        <Dialog open={expandedJson} onOpenChange={setExpandedJson}>
          <DialogContent className="groove-border bg-card max-w-2xl max-h-[80vh] flex flex-col p-0">
            <DialogHeader className="px-6 flex items-center" style={{ borderBottom: '3px groove hsl(var(--border-groove))', minHeight: '60px' }}>
              <DialogTitle className="text-foreground uppercase" style={headerStyle}>
                Request Body
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 pt-6 pb-6 overflow-auto flex-1">
              <pre className="text-foreground whitespace-pre-wrap break-all" style={fieldStyle}>
                {jsonContent}
              </pre>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Row height ~44px, show 4 visible = ~176px
  const listMaxHeight = VISIBLE_COUNT * 44;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-foreground capitalize" style={fieldStyle}>Webhook Requests</label>
        <button
          className="groove-btn !h-7 px-2 flex items-center gap-1 text-xs"
          onClick={() => fetchRequests(true)}
          disabled={loading}
          style={fieldStyle}
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Fetch
        </button>
      </div>

      <div className="border border-border rounded-md" style={{ maxHeight: 'calc(100vh - 480px)', minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
        {requests.length === 0 ? (
          <div className="p-3 text-center flex-1 flex items-center justify-center">
            <div className="text-muted-foreground" style={fieldStyle}>
              Send a POST request to your webhook URL to see it here.
            </div>
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="space-y-1 overflow-y-auto p-2 flex-1"
            onScroll={handleScroll}
          >
          {requests.map((req) => {
            const isActive = activeReferenceId === req.id;
            return (
              <button
                key={req.id}
                className="w-full text-left px-2 py-2 groove-border bg-card hover:bg-accent transition-colors relative"
                onClick={() => setSelectedRequest(req)}
              >
                {isActive && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                )}
                <div className="text-foreground truncate pr-4" style={fieldStyle}>
                  {req.id}
                </div>
                <div className="text-muted-foreground" style={fieldStyle}>
                  {formatTime(req.received_at)}
                </div>
              </button>
            );
          })}
          {loading && (
            <div className="text-center py-2 text-muted-foreground" style={fieldStyle}>
              Loading...
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
