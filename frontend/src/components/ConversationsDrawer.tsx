import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronDown, ChevronRight, User, Bot, Search } from '@/components/icons';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';

interface Message {
  type: string;
  content: string;
  timestamp?: string;
}

interface Conversation {
  session_id?: string;
  client_id?: string;
  message_count?: number;
  first_timestamp?: string;
  last_timestamp?: string;
  messages: Message[];
}

export interface AiMatch {
  session_id: string;
  message_index: number;
  timestamp: string;
  snippet?: string;
}

interface ConversationsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metricName: string;
  metricCount?: number | string | null;
  conversationsList?: Conversation[];
  aiMatches?: AiMatch[];
  isAnalyzing?: boolean;
}

/** Sanitize message content — strip metadata, attachments, technical noise. */
function sanitizeContent(raw: string): string {
  if (!raw) return '';
  let text = raw;
  text = text.replace(/^#\s*USER\s*LAST\s*UTTERANCE\s*/i, '');
  text = text.split(/\s*(?:Attachment:\s*|#\s*USER\s*INPUT\s*ATTACH|\(FILES\/IMAGE\/AUDIO EXTRACTED CONTENT\):)/i)[0];
  text = text.replace(/^#\s*\w[\w\s]*\n?/gm, '');
  text = text.replace(/https?:\/\/\S+/gi, '');
  text = text.replace(/\.\w+\s+Audio\s+[\d\-]+\s+at\s+[\d.]+\.\w+/gi, '');
  text = text.replace(/\n{2,}/g, '\n').trim();
  return text;
}

/** Get highlight keywords for a given metric */
function getHighlightPatterns(metricName: string): RegExp | null {
  const n = metricName.toUpperCase().trim();
  if (n === 'THANK YOU COUNT') {
    return /\b(thank\s*you|thanks|appreciate|grateful|thankful)\b/gi;
  }
  if (n === 'USER QUESTIONS ASKED' || n === 'QUESTIONS ASKED') {
    // Highlight question marks and interrogative words
    return /(\?|(?:^|\s)(who|what|when|where|why|how|can|could|would|should|is|are|do|does|did|will|shall)(?=\s))/gi;
  }
  if (n === 'STOP BOT') {
    return /\b(stop\s*bot|stop)\b/gi;
  }
  // For custom metrics, try to highlight the metric name as keyword
  if (n !== 'BOT MESSAGES' && n !== 'TOTAL BOT MESSAGES' && n !== 'TOTAL CONVERSATIONS' && n !== 'NEW USERS' && n !== 'NEW USER MESSAGES') {
    const kw = metricName.trim();
    if (kw.length >= 2) {
      try {
        return new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      } catch { return null; }
    }
  }
  return null;
}

/** Render text with highlighted matching portions */
function HighlightedText({ text, pattern }: { text: string; pattern: RegExp | null }) {
  if (!pattern || !text) return <>{text}</>;
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  
  // Reset regex
  pattern.lastIndex = 0;
  
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <mark key={match.index} className="bg-yellow-400 text-black rounded-sm px-0.5 font-semibold">
        {match[0]}
      </mark>
    );
    lastIndex = pattern.lastIndex;
    if (match[0].length === 0) pattern.lastIndex++; // prevent infinite loop
  }
  
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return <>{parts.length > 0 ? parts : text}</>;
}

/** Filter messages matching metric type. Returns only relevant messages. */
function getMatchingMessages(messages: Message[], metricName: string): Message[] {
  const n = metricName.toUpperCase().trim();
  if (n === 'BOT MESSAGES' || n === 'TOTAL BOT MESSAGES') {
    return messages.filter(m => m.type === 'ai' || m.type === 'assistant' || m.type === 'bot');
  }
  if (n === 'USER QUESTIONS ASKED' || n === 'QUESTIONS ASKED') {
    return messages.filter(m => m.type === 'human' || m.type === 'user');
  }
  if (n === 'THANK YOU COUNT') {
    return messages.filter(m => {
      const c = (m.content || '').toLowerCase();
      return c.includes('thank you') || c.includes('thanks') || c.includes('appreciate') || c.includes('grateful');
    });
  }
  if (n === 'TOTAL CONVERSATIONS' || n === 'NEW USERS' || n === 'NEW USER MESSAGES') {
    return messages; // show all messages for these
  }
  // Custom metrics — keyword match in content
  const kw = metricName.toLowerCase();
  return messages.filter(m => (m.content || '').toLowerCase().includes(kw));
}

/** Enrich conversations with synthetic fields if missing. */
function enrichConversation(conv: Conversation, index: number): Conversation {
  const msgs = conv.messages || [];
  const ts = msgs.map(m => m.timestamp).filter(Boolean).sort();
  return {
    ...conv,
    session_id: conv.session_id || `session-${index + 1}`,
    message_count: conv.message_count || msgs.length,
    first_timestamp: conv.first_timestamp || ts[0],
    last_timestamp: conv.last_timestamp || ts[ts.length - 1],
  };
}

/**
 * Classify conversations by metric. Returns only conversations that have
 * at least one matching message (after sanitization). Never falls back to "all".
 */
function classifyConversations(list: Conversation[], metricName: string): Conversation[] {
  const n = metricName.toUpperCase().trim();

  if (n === 'TOTAL CONVERSATIONS') return list;

  if (n === 'NEW USERS' || n === 'NEW USER MESSAGES') {
    const seen = new Set<string>();
    return list.filter(conv => {
      const key = conv.client_id || conv.session_id || conv.first_timestamp || '';
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // For ALL other metrics (including custom): only show conversations
  // that have at least 1 matching message with non-empty sanitized content
  return list.filter(conv => {
    const matching = getMatchingMessages(conv.messages || [], metricName);
    return matching.some(m => sanitizeContent(m.content).length > 0);
  });
}

// ─── Conversation Row ────────────────────────────────────────────────
function ConversationRow({ conversation, metricName, aiMatches }: { conversation: Conversation; metricName: string; aiMatches?: AiMatch[] }) {
  const [expanded, setExpanded] = useState(false);
  const [showFullConversation, setShowFullConversation] = useState(false);

  const highlightPattern = useMemo(() => getHighlightPatterns(metricName), [metricName]);

  // Build a set of AI-matched message indices for this session
  const aiMatchedIndices = useMemo(() => {
    if (!aiMatches || aiMatches.length === 0) return null;
    const sid = conversation.session_id || '';
    const indices = new Set<number>();
    for (const m of aiMatches) {
      if (m.session_id === sid) indices.add(m.message_index);
    }
    return indices.size > 0 ? indices : null;
  }, [aiMatches, conversation.session_id]);

  // All messages sanitized with original index
  const allMessages = useMemo(() => {
    return (conversation.messages || [])
      .map((msg, idx) => ({ ...msg, content: sanitizeContent(msg.content), _originalIndex: idx }))
      .filter(msg => msg.content.length > 0);
  }, [conversation.messages]);

  // Display: if AI matches exist and not showing full, show only matched messages
  const displayMessages = useMemo(() => {
    if (aiMatchedIndices && !showFullConversation) {
      return allMessages.filter(msg => aiMatchedIndices.has(msg._originalIndex));
    }
    if (aiMatchedIndices) {
      return allMessages;
    }
    const matching = getMatchingMessages(conversation.messages || [], metricName);
    return matching
      .map(msg => ({ ...msg, content: sanitizeContent(msg.content), _originalIndex: -1 }))
      .filter(msg => msg.content.length > 0);
  }, [conversation.messages, metricName, aiMatchedIndices, showFullConversation, allMessages]);

  const matchCount = aiMatchedIndices ? aiMatchedIndices.size : displayMessages.length;

  return (
    <div className="border border-border">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
        <div className="flex-1 min-w-0 space-y-1">
          {conversation.client_id && (
            <div className="text-[13px]">
              <span className="font-bold text-foreground">{conversation.client_id}</span>
            </div>
          )}
          <div className="text-[13px] text-muted-foreground">
            <span className="font-medium text-foreground">Session:</span>{' '}
            {conversation.session_id}
          </div>
          <div className="text-[13px] text-muted-foreground">
            Started: {conversation.first_timestamp
              ? format(new Date(conversation.first_timestamp), 'MMM d, yyyy h:mm a')
              : 'N/A'}
            {' | '}
            Ended: {conversation.last_timestamp
              ? format(new Date(conversation.last_timestamp), 'MMM d, yyyy h:mm a')
              : 'N/A'}
          </div>
          <div className="text-[13px] text-muted-foreground">
            Matching messages: {matchCount}
            {aiMatchedIndices && (
              <span className="ml-2 text-primary text-[11px]">✦ AI analyzed</span>
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border p-3 space-y-2 bg-muted/20">
          {aiMatchedIndices && (
            <button
              type="button"
              onClick={() => setShowFullConversation(!showFullConversation)}
              className="text-[11px] text-primary hover:underline mb-1"
            >
              {showFullConversation ? '← Show only matched messages' : 'Show full conversation →'}
            </button>
          )}
          {displayMessages.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">
              No matching messages
            </div>
          ) : (
            displayMessages.map((msg, i) => {
              const isHuman = msg.type === 'human' || msg.type === 'user';
              const isAiMatched = aiMatchedIndices ? aiMatchedIndices.has(msg._originalIndex) : false;
              const shouldHighlight = aiMatchedIndices ? isAiMatched : true;
              return (
                <div key={i} className={`flex ${isHuman ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] px-3 py-2 text-[13px] rounded-lg relative ${
                      isHuman ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-100'
                    } ${shouldHighlight ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : 'opacity-50'}`}
                  >
                    {shouldHighlight && (
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-primary" />
                    )}
                    <div className="flex items-center gap-1.5 mb-1 opacity-70">
                      {isHuman ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                      <span className="text-[11px]">{isHuman ? 'User' : 'AI'}</span>
                      {msg.timestamp && (
                        <span className="text-[11px] ml-auto">
                          {format(new Date(msg.timestamp), 'h:mm a')}
                        </span>
                      )}
                    </div>
                    <HighlightedText text={msg.content} pattern={shouldHighlight ? highlightPattern : null} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
// ─── Main Drawer ─────────────────────────────────────────────────────
export function ConversationsDrawer({
  open,
  onOpenChange,
  metricName,
  metricCount,
  conversationsList = [],
  aiMatches,
  isAnalyzing,
}: ConversationsDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const enriched = useMemo(() => {
    if (!conversationsList || conversationsList.length === 0) return [];
    return conversationsList.map((c, i) => enrichConversation(c, i));
  }, [conversationsList]);

  // If AI matches are present, filter to only conversations that have matches
  const classified = useMemo(() => {
    if (enriched.length === 0) return [];
    if (aiMatches && aiMatches.length > 0) {
      const matchedSessions = new Set(aiMatches.map(m => m.session_id));
      return enriched.filter(c => matchedSessions.has(c.session_id || ''));
    }
    return classifyConversations(enriched, metricName);
  }, [enriched, metricName, aiMatches]);

  // Count total matching messages
  const totalMatchingMessages = useMemo(() => {
    if (aiMatches && aiMatches.length > 0) return aiMatches.length;
    let count = 0;
    for (const conv of classified) {
      const matching = getMatchingMessages(conv.messages || [], metricName);
      for (const m of matching) {
        if (sanitizeContent(m.content).length > 0) count++;
      }
    }
    return count;
  }, [classified, metricName, aiMatches]);

  // For New Users metric, show unique user count
  const uniqueUserCount = useMemo(() => {
    const n = metricName.toUpperCase().trim();
    if (n === 'NEW USERS' || n === 'NEW USER MESSAGES') {
      const uniqueClients = new Set(enriched.map(c => c.client_id).filter(Boolean));
      return uniqueClients.size;
    }
    return null;
  }, [enriched, metricName]);

  // Filter by search query
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return classified;
    const q = searchQuery.toLowerCase();
    return classified.filter(c =>
      (c.client_id || '').toLowerCase().includes(q) ||
      (c.session_id || '').toLowerCase().includes(q)
    );
  }, [classified, searchQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>
            {metricName || 'Conversations'}
            {metricCount !== undefined && metricCount !== null && (
              <span className="ml-2 text-muted-foreground font-normal">({metricCount})</span>
            )}
            {aiMatches && (
              <span className="ml-2 text-primary text-[12px] font-normal">✦ AI Analyzed</span>
            )}
          </DialogTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {isAnalyzing ? (
              <p className="text-[12px] text-muted-foreground flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Analyzing conversations with AI...
              </p>
            ) : (
              <p className="text-[12px] text-muted-foreground">
                {totalMatchingMessages} matching message{totalMatchingMessages !== 1 ? 's' : ''} across {filtered.length} conversation{filtered.length !== 1 ? 's' : ''}
              </p>
            )}
            {uniqueUserCount !== null && (
              <span className="text-[12px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                {uniqueUserCount} unique user{uniqueUserCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by Client ID or Session ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-[13px]"
            />
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 space-y-2">
            {isAnalyzing ? (
              <div className="text-xs text-muted-foreground text-center py-8 flex flex-col items-center gap-2">
                <span className="inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                AI is analyzing conversations...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-8">
                No conversations found for this metric
              </div>
            ) : (
              filtered.map((conv, i) => (
                <ConversationRow
                  key={conv.session_id || i}
                  conversation={conv}
                  metricName={metricName}
                  aiMatches={aiMatches}
                />
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
