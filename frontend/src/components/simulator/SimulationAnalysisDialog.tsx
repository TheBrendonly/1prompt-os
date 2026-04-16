import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Send, Loader2, Sparkles, User, Copy } from '@/components/icons';

interface SimulationAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  simulationId: string;
  clientId: string;
  simulationName: string;
}

interface AnalysisMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

const SUGGESTED_QUESTIONS = [
  "Analyze all conversations and give me a summary of how well the setter performed",
  "Which conversations failed to convert the lead? Why?",
  "What objections did the setter handle poorly?",
  "Give me specific prompt improvements based on the simulation results",
  "Which persona had the best conversation and why?",
  "Create a table comparing all conversations by engagement and outcome",
];

const THINKING_MESSAGES = [
  "Analyzing simulation data...",
  "Reviewing all conversations...",
  "Comparing setter performance...",
  "Identifying patterns...",
  "Generating insights...",
  "Building recommendations...",
];

export function SimulationAnalysisDialog({
  open,
  onOpenChange,
  simulationId,
  clientId,
  simulationName,
}: SimulationAnalysisDialogProps) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AnalysisMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingIdx, setThinkingIdx] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Rotate thinking messages
  useEffect(() => {
    if (!isLoading) { setThinkingIdx(0); return; }
    const interval = setInterval(() => {
      setThinkingIdx(prev => (prev + 1) % THINKING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => { if (isLoading) scrollToBottom(); }, [isLoading, scrollToBottom]);

  // Load or create thread when dialog opens
  useEffect(() => {
    if (!open || !simulationId || !clientId) return;

    const initThread = async () => {
      // Check for existing thread
      const { data: existing } = await (supabase as any)
        .from('simulation_analysis_threads')
        .select('id')
        .eq('simulation_id', simulationId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existing && existing.length > 0) {
        setThreadId(existing[0].id);
        // Load messages
        const { data: msgs } = await (supabase as any)
          .from('simulation_analysis_messages')
          .select('*')
          .eq('thread_id', existing[0].id)
          .order('created_at', { ascending: true });
        setMessages((msgs || []) as AnalysisMessage[]);
      } else {
        // Create new thread
        const { data: newThread, error } = await (supabase as any)
          .from('simulation_analysis_threads')
          .insert({ simulation_id: simulationId, client_id: clientId })
          .select()
          .single();
        if (error) {
          console.error('Failed to create analysis thread:', error);
          toast.error('Failed to initialize analysis');
          return;
        }
        setThreadId(newThread.id);
        setMessages([]);
      }
    };

    initThread();
  }, [open, simulationId, clientId]);

  const sendMessage = async (messageText?: string) => {
    const text = (messageText || currentMessage).trim();
    if (!text || !threadId || !clientId || isLoading) return;

    setCurrentMessage('');
    setIsLoading(true);

    try {
      // Save user message to DB
      const { data: userMsg, error: userErr } = await (supabase as any)
        .from('simulation_analysis_messages')
        .insert({ thread_id: threadId, role: 'user', content: text })
        .select()
        .single();

      if (userErr) throw userErr;
      setMessages(prev => [...prev, userMsg as AnalysisMessage]);

      // Call edge function
      const { data: fnData, error: fnError } = await supabase.functions.invoke('analyze-simulation', {
        body: {
          simulationId,
          question: text,
          threadId,
          clientId,
        },
      });

      if (fnError) throw fnError;

      if (fnData?.error) {
        throw new Error(fnData.error);
      }

      const aiContent = fnData?.answer || 'No response generated.';

      // Save AI response to DB
      const { data: aiMsg, error: aiErr } = await (supabase as any)
        .from('simulation_analysis_messages')
        .insert({ thread_id: threadId, role: 'assistant', content: aiContent })
        .select()
        .single();

      if (aiErr) {
        console.error('Failed to save AI response:', aiErr);
      }

      const finalMsg: AnalysisMessage = (aiMsg as AnalysisMessage) || {
        id: `local-${Date.now()}`,
        role: 'assistant',
        content: aiContent,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, finalMsg]);
    } catch (err: any) {
      console.error('Analysis error:', err);
      toast.error(err.message || 'Failed to analyze simulation');

      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ ${err.message || 'An error occurred while analyzing the simulation. Please try again.'}`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch { /* ignore */ }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col" style={{ width: '90vw' }}>
        <DialogHeader>
          <DialogTitle>
            ANALYZE SIMULATION
          </DialogTitle>
        </DialogHeader>

        {/* Chat Area */}
        <div
          ref={scrollContainerRef}
          className={`flex-1 min-h-0 overflow-y-auto px-6 py-4 ${
            messages.length > 0 ? '' : 'flex items-center justify-center'
          }`}
        >
          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto text-center">
              <Sparkles className="h-10 w-10 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="mb-3 text-foreground" style={{ fontFamily: "'VT323', monospace", fontSize: '20px' }}>
                ANALYZE YOUR SIMULATION
              </h3>
              <p className="field-text text-muted-foreground mb-6 leading-relaxed">
                This AI agent has access to all conversations from this simulation and the setter's full prompt.
                Ask questions to understand performance and get improvement suggestions.
              </p>
              {threadId && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      disabled={isLoading}
                      className="text-left field-text px-3 py-2 groove-border bg-muted/30 hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-4 groove-border'
                        : 'bg-card groove-border mr-4'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="field-text whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="prose prose-sm max-w-none dark:prose-invert field-text leading-relaxed">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ children }) => <h1 className="text-xl font-bold mb-4 mt-2 text-foreground border-b pb-2">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-lg font-semibold mb-3 mt-4 text-foreground">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-base font-semibold mb-2 mt-3 text-foreground">{children}</h3>,
                            p: ({ children }) => <p className="mb-3 last:mb-0 text-foreground/90 leading-relaxed">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc list-outside ml-4 mb-3 space-y-1.5">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-outside ml-4 mb-3 space-y-1.5">{children}</ol>,
                            li: ({ children }) => <li className="text-sm text-foreground/90 leading-relaxed pl-1">{children}</li>,
                            code: ({ children, className }) => {
                              const isInline = !className;
                              return isInline
                                ? <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                                : <code className="block bg-muted/80 p-4 rounded text-xs font-mono border overflow-x-auto my-3">{children}</code>;
                            },
                            pre: ({ children }) => <div className="bg-muted/80 p-4 rounded border overflow-x-auto my-3">{children}</div>,
                            blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/50 pl-4 italic my-3 text-foreground/80 bg-primary/5 py-2 rounded-r">{children}</blockquote>,
                            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                            table: ({ children }) => (
                              <div className="overflow-x-auto my-4 groove-border">
                                <table className="min-w-full border-collapse bg-card">{children}</table>
                              </div>
                            ),
                            thead: ({ children }) => <thead className="bg-primary/10 border-b-2 border-primary/20">{children}</thead>,
                            tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
                            tr: ({ children }) => <tr className="hover:bg-muted/50 transition-colors">{children}</tr>,
                            th: ({ children }) => <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground">{children}</th>,
                            td: ({ children }) => <td className="px-4 py-3 text-sm text-foreground/90">{children}</td>,
                            hr: () => <hr className="my-4 border-border" />,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[11px] opacity-70 flex items-center gap-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        {msg.role === 'user' ? (
                          <><User className="w-3 h-3" /><span>You</span></>
                        ) : (
                          <><Sparkles className="w-3 h-3" /><span>AI Analyst</span></>
                        )}
                        <span>•</span>
                        <span>{new Date(msg.created_at).toLocaleTimeString()}</span>
                      </p>
                      {msg.role === 'assistant' && (
                        <button
                          className="groove-btn !h-6 !w-6 !p-0 !min-h-0 !min-w-0 flex items-center justify-center opacity-50 hover:opacity-100"
                          onClick={() => copyToClipboard(msg.content)}
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted groove-border px-4 py-3 mr-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="field-text">{THINKING_MESSAGES[thinkingIdx]}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="px-6 py-4 flex-shrink-0" style={{ borderTop: '3px groove hsl(var(--border-groove))' }}>
          <div className="flex gap-2 items-center">
            <Input
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about your simulation results..."
              disabled={isLoading || !threadId}
              className="flex-1 !h-8 field-text"
            />
            <Button
              onClick={() => sendMessage()}
              disabled={isLoading || !currentMessage.trim() || !threadId}
              className="shrink-0 !bg-foreground !text-background !border-foreground groove-btn"
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing...</>
              ) : (
                <><Send className="h-4 w-4 mr-2" />Send</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
