import React, { useState, useRef, useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, FileText, Play, Pause, ChevronDown, ChevronUp, Loader2, Volume2, Calendar, Hash, BarChart3 } from '@/components/icons';
const Volume2Alias = Volume2;
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Interface matching the webhook response structure
interface TranscriptRecord {
  Id: number;
  Timestamp: string;
  Session_Id: string;
  Call_Recording: string;
  Call_Transcript: string;
}
interface VoiceCallLogsTableProps {
  transcriptData?: TranscriptRecord[];
  isLoading?: boolean;
}

// Empty array constant to prevent recreating on every render
const EMPTY_TRANSCRIPT_DATA: TranscriptRecord[] = [];

// Inline Audio Player Component
const AudioPlayer: React.FC<{
  src: string;
  compact?: boolean;
}> = ({
  src,
  compact = false
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      setIsLoading(true);
      audioRef.current.play().finally(() => setIsLoading(false));
    }
  };
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    audioRef.current.currentTime = percentage * duration;
  };
  const progress = duration ? currentTime / duration * 100 : 0;
  if (compact) {
    return <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
        <audio ref={audioRef} src={src} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className={cn("h-8 w-8 p-0 rounded-full transition-all", isPlaying ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-primary hover:text-primary hover:bg-primary/10")} onClick={togglePlay} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isPlaying ? 'Pause' : 'Play'} recording</p>
          </TooltipContent>
        </Tooltip>
        {isPlaying && <span className="text-xs text-primary font-mono">
            {formatTime(currentTime)}
          </span>}
      </div>;
  }
  return <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-4 border border-border" onClick={e => e.stopPropagation()}>
      <audio ref={audioRef} src={src} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} />
      
      <Button variant="outline" size="sm" className={cn("h-10 w-10 p-0 rounded-full border-2 transition-all shadow-sm", isPlaying ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90" : "bg-card text-primary border-primary/30 hover:bg-primary/10 hover:border-primary")} onClick={togglePlay} disabled={isLoading}>
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
      </Button>

      <div className="flex-1 space-y-1">
        <div className="h-2 bg-muted rounded-full cursor-pointer overflow-hidden" onClick={handleSeek}>
          <div className="h-full bg-primary rounded-full transition-all duration-100" style={{
          width: `${progress}%`
        }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <Volume2 className="w-4 h-4 text-muted-foreground" />
    </div>;
};
const VoiceCallLogsTableComponent: React.FC<VoiceCallLogsTableProps> = ({
  transcriptData,
  isLoading = false
}) => {
  // Use stable empty array reference
  const stableTranscriptData = transcriptData ?? EMPTY_TRANSCRIPT_DATA;
  
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  
  const toggleRowExpansion = (id: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  
  const formatTranscript = (transcript: string) => {
    return transcript.replace(/\\n/g, '\n');
  };

  const formatTimestamp = (timestamp: string | null | undefined, formatStr: string): string => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Invalid date';
      return format(date, formatStr);
    } catch {
      return 'Invalid date';
    }
  };

  // Parse transcript into conversation format
  const parseConversation = (transcript: string) => {
    const lines = formatTranscript(transcript).split('\n').filter(line => line.trim());
    return lines.map((line, index) => {
      const isAgent = line.toLowerCase().startsWith('agent:');
      const isUser = line.toLowerCase().startsWith('user:');
      const content = line.replace(/^(agent:|user:)/i, '').trim();
      return {
        id: index,
        role: isAgent ? 'agent' : isUser ? 'user' : 'other',
        content
      };
    });
  };
  // Memoize parsed conversations to prevent re-parsing on every render
  const parsedConversations = useMemo(() => {
    return stableTranscriptData.reduce((acc, record) => {
      if (record.Call_Transcript) {
        const lines = formatTranscript(record.Call_Transcript).split('\n').filter(line => line.trim());
        acc[record.Id] = lines.map((line, index) => {
          const isAgent = line.toLowerCase().startsWith('agent:');
          const isUser = line.toLowerCase().startsWith('user:');
          const content = line.replace(/^(agent:|user:)/i, '').trim();
          return {
            id: index,
            role: isAgent ? 'agent' : isUser ? 'user' : 'other',
            content
          };
        });
      }
      return acc;
    }, {} as Record<number, Array<{ id: number; role: string; content: string }>>);
  }, [stableTranscriptData]);
  
  // Fixed height container to prevent layout shifts during loading/navigation
  return <Card className="border-border shadow-sm overflow-hidden min-h-[400px]">
      <CardHeader className="pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg">
            <Phone className="w-5 h-5 text-muted-foreground" />
            Call Recordings & Transcripts
          </CardTitle>
          <Badge variant="outline" className="bg-muted text-foreground border-border px-3 py-1.5 text-sm font-medium">
            {isLoading ? '...' : `${stableTranscriptData.length} Calls`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="text-center py-16 px-6">
            <Loader2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
            <p className="text-lg font-medium text-foreground">Loading Call Logs</p>
            <p className="text-sm text-muted-foreground mt-1">Please wait...</p>
          </div>
        ) : stableTranscriptData.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg m-6">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">No Call Recordings Found</h4>
            <p className="text-sm text-muted-foreground">
              Call recordings and transcripts will appear here
            </p>
          </div>
        ) : <ScrollArea className="h-[600px]">
            <div className="divide-y divide-border">
              {stableTranscriptData.map((record, index) => <div key={`call-${record.Id}-${record.Session_Id}`} className="group">
                  {/* Main Row - Simplified: just number, date, and play button */}
                  <div className={cn("flex items-center gap-4 px-6 py-4 cursor-pointer transition-all duration-200", "hover:bg-muted/50", expandedRows.has(record.Id) && "bg-muted/30")} onClick={() => toggleRowExpansion(record.Id)}>
                    {/* Expand Button */}
                    <Button variant="ghost" size="sm" className={cn("w-8 h-8 p-0 rounded-full transition-all", expandedRows.has(record.Id) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")} onClick={e => {
                e.stopPropagation();
                toggleRowExpansion(record.Id);
              }}>
                      {expandedRows.has(record.Id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>

                    {/* Call Number Badge */}
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-sm">
                      {index + 1}
                    </div>

                    {/* Date & Time */}
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {formatTimestamp(record.Timestamp, 'MMM d, yyyy')}
                        <span className="text-muted-foreground">at</span>
                        {formatTimestamp(record.Timestamp, 'h:mm a')}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {record.Call_Recording && <AudioPlayer src={record.Call_Recording} compact />}
                      
                      {record.Call_Transcript && <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted" onClick={e => e.stopPropagation()} title="View Full Transcript">
                              <FileText className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden !p-0">
                            <DialogHeader>
                              <DialogTitle>
                                Call Transcript
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 p-6">
                              <div className="flex flex-wrap items-center gap-3 text-sm">
                                <Badge variant="outline" className="bg-muted text-foreground border-border">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {formatTimestamp(record.Timestamp, 'PPpp')}
                                </Badge>
                                <Badge variant="outline" className="bg-muted font-mono text-xs">
                                  <Hash className="w-3 h-3 mr-1" />
                                  {record.Session_Id}
                                </Badge>
                              </div>
                              
                              {/* Audio Player in Dialog */}
                              {record.Call_Recording && <AudioPlayer src={record.Call_Recording} />}

                              {/* Conversation View */}
                              <ScrollArea className="h-[350px] border border-border rounded-lg bg-muted/20 p-4">
                                <div className="space-y-3">
                                  {(parsedConversations[record.Id] || []).map(msg => <div key={`dialog-msg-${msg.id}`} className={cn("flex", msg.role === 'agent' ? "justify-start" : "justify-end")}>
                                      <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5 text-sm", msg.role === 'agent' ? "bg-card border border-border text-foreground rounded-tl-sm" : msg.role === 'user' ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-muted-foreground")}>
                                        <div className="text-[10px] font-semibold mb-1 opacity-70 uppercase tracking-wide">
                                          {msg.role === 'agent' ? '🤖 Agent' : msg.role === 'user' ? '👤 User' : ''}
                                        </div>
                                        {msg.content}
                                      </div>
                                    </div>)}
                                </div>
                              </ScrollArea>
                            </div>
                          </DialogContent>
                        </Dialog>}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedRows.has(record.Id) && <div className="px-6 pb-6 bg-muted/20">
                      <div className="ml-12 space-y-4">
                        {/* Audio Player */}
                        {record.Call_Recording && <div className="space-y-2">
                            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                              <Volume2 className="w-4 h-4 text-primary" />
                              Recording
                            </h4>
                            <AudioPlayer src={record.Call_Recording} />
                          </div>}

                        {/* Transcript */}
                        {record.Call_Transcript && <div className="space-y-2">
                            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                              <FileText className="w-4 h-4 text-primary" />
                              Conversation
                            </h4>
                            <div className="bg-card border border-border rounded-lg p-4 max-h-[400px] overflow-y-auto shadow-sm">
                              <div className="space-y-3">
                                {(parsedConversations[record.Id] || []).map(msg => <div key={`expanded-msg-${msg.id}`} className={cn("flex", msg.role === 'agent' ? "justify-start" : "justify-end")}>
                                    <div className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm", msg.role === 'agent' ? "bg-muted border border-border text-foreground rounded-tl-sm" : msg.role === 'user' ? "bg-primary text-primary-foreground rounded-tr-sm shadow-sm" : "bg-muted text-muted-foreground")}>
                                      <div className="text-[10px] font-semibold mb-1 opacity-70 uppercase tracking-wide">
                                        {msg.role === 'agent' ? '🤖 Agent' : msg.role === 'user' ? '👤 User' : ''}
                                      </div>
                                      {msg.content}
                                    </div>
                                  </div>)}
                              </div>
                            </div>
                          </div>}

                        {/* Session ID - only shown when expanded */}
                        <div className="text-xs text-muted-foreground flex items-center gap-2 pt-2 border-t border-border">
                          <Hash className="w-3 h-3" />
                          Session ID: <span className="font-mono bg-muted px-2 py-0.5 rounded">{record.Session_Id}</span>
                        </div>
                      </div>
                    </div>}
                </div>)}
            </div>
          </ScrollArea>}
      </CardContent>
    </Card>;
};

// Memoize to prevent re-renders when parent updates but props haven't changed
export const VoiceCallLogsTable = memo(VoiceCallLogsTableComponent);
export default VoiceCallLogsTable;