import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { RefreshCw, Loader2, PhoneCall, PhoneOutgoing, Clock, ExternalLink } from 'lucide-react';
import { useRetellApi, RetellCall, RetellAgent } from '@/hooks/useRetellApi';

interface RetellCallLogsTabProps {
  clientId: string;
}

const RetellCallLogsTab: React.FC<RetellCallLogsTabProps> = ({ clientId }) => {
  const retell = useRetellApi(clientId);
  const [calls, setCalls] = useState<RetellCall[]>([]);
  const [agents, setAgents] = useState<RetellAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<RetellCall | null>(null);
  const [loadingCall, setLoadingCall] = useState(false);

  // Outbound call form
  const [showCallForm, setShowCallForm] = useState(false);
  const [callFromNumber, setCallFromNumber] = useState('');
  const [callToNumber, setCallToNumber] = useState('');
  const [callAgentId, setCallAgentId] = useState('');
  const [makingCall, setMakingCall] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [callsData, agentsData] = await Promise.all([
        retell.listCalls(),
        retell.listAgents(),
      ]);
      setCalls(Array.isArray(callsData) ? callsData : []);
      setAgents(Array.isArray(agentsData) ? agentsData : []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load calls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []); // eslint-disable-line

  const handleViewCall = async (callId: string) => {
    setLoadingCall(true);
    try {
      const call = await retell.getCall(callId);
      setSelectedCall(call);
    } catch (err) {
      toast.error('Failed to load call details');
    } finally {
      setLoadingCall(false);
    }
  };

  const handleMakeCall = async () => {
    if (!callFromNumber.trim() || !callToNumber.trim()) {
      toast.error('Both phone numbers are required');
      return;
    }
    setMakingCall(true);
    try {
      const callData: Record<string, unknown> = {
        from_number: callFromNumber.trim(),
        to_number: callToNumber.trim(),
      };
      if (callAgentId) callData.override_agent_id = callAgentId;

      await retell.createPhoneCall(callData);
      toast.success('Outbound call initiated');
      setShowCallForm(false);
      setCallFromNumber('');
      setCallToNumber('');
      setCallAgentId('');
      setTimeout(() => fetchAll(), 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to make call');
    } finally {
      setMakingCall(false);
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    const secs = Math.round(ms / 1000);
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (ts?: number) => {
    if (!ts) return '-';
    return new Date(ts).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ended': return 'default';
      case 'error': return 'destructive';
      case 'registered':
      case 'ongoing': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Call Logs</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{calls.length} call{calls.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCallForm(!showCallForm)}>
            <PhoneOutgoing className="h-3.5 w-3.5 mr-1" /> Make Call
          </Button>
        </div>
      </div>

      {showCallForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">From Number</Label>
                <Input
                  value={callFromNumber}
                  onChange={e => setCallFromNumber(e.target.value)}
                  placeholder="+14157774444"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">To Number</Label>
                <Input
                  value={callToNumber}
                  onChange={e => setCallToNumber(e.target.value)}
                  placeholder="+12137774445"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Override Agent (optional)</Label>
              <Select value={callAgentId || 'none'} onValueChange={v => setCallAgentId(v === 'none' ? '' : v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Use default agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Use phone's default agent</SelectItem>
                  {agents.map(a => (
                    <SelectItem key={a.agent_id} value={a.agent_id}>
                      {a.agent_name || a.agent_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCallForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleMakeCall} disabled={makingCall}>
                {makingCall && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                Call Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {calls.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <PhoneCall className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No calls yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1">
          {calls.slice(0, 50).map(call => (
            <Card
              key={call.call_id}
              className="cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => handleViewCall(call.call_id)}
            >
              <div className="flex items-center gap-3 p-3">
                <PhoneCall className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {call.agent_name || 'Unknown Agent'}
                    </span>
                    <Badge variant={getStatusColor(call.call_status) as any} className="text-[10px] py-0 px-1.5">
                      {call.call_status}
                    </Badge>
                    {call.direction && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                        {call.direction}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-3 text-[11px] text-muted-foreground mt-0.5">
                    {call.from_number && <span>From: {call.from_number}</span>}
                    {call.to_number && <span>To: {call.to_number}</span>}
                    <span className="flex items-center gap-0.5">
                      <Clock className="h-3 w-3" />
                      {formatDuration(call.duration_ms)}
                    </span>
                    <span>{formatTimestamp(call.start_timestamp)}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Call Detail Dialog */}
      <Dialog open={!!selectedCall} onOpenChange={open => { if (!open) setSelectedCall(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-wide">
              Call Details
            </DialogTitle>
          </DialogHeader>
          {loadingCall ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : selectedCall ? (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                {/* Meta */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Call ID</Label>
                    <p className="font-mono text-xs">{selectedCall.call_id}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <p>{selectedCall.call_status}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Duration</Label>
                    <p>{formatDuration(selectedCall.duration_ms)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Direction</Label>
                    <p>{selectedCall.direction || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <p>{selectedCall.from_number || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <p>{selectedCall.to_number || '-'}</p>
                  </div>
                  {selectedCall.disconnection_reason && (
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">Disconnection Reason</Label>
                      <p>{selectedCall.disconnection_reason}</p>
                    </div>
                  )}
                </div>

                {/* Recording */}
                {selectedCall.recording_url && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Recording</Label>
                    <audio controls src={selectedCall.recording_url} className="w-full mt-1" />
                  </div>
                )}

                {/* Transcript */}
                {selectedCall.transcript && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Transcript</Label>
                    <div className="mt-1 p-3 rounded-md bg-muted/50 text-sm whitespace-pre-wrap font-mono text-xs max-h-[300px] overflow-auto">
                      {selectedCall.transcript}
                    </div>
                  </div>
                )}

                {/* Analysis */}
                {selectedCall.call_analysis && Object.keys(selectedCall.call_analysis).length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Call Analysis</Label>
                    <pre className="mt-1 p-3 rounded-md bg-muted/50 text-xs overflow-auto">
                      {JSON.stringify(selectedCall.call_analysis, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedCall.public_log_url && (
                  <a
                    href={selectedCall.public_log_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> View Full Log
                  </a>
                )}
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RetellCallLogsTab;
