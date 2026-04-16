import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Send, Plus, User, Copy, Loader2, Trash2, Edit, Sparkles } from '@/components/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ConfigStatusBar } from '@/components/ConfigStatusBar';

// Default webhook URL for presentation agent
const DEFAULT_PRESENTATION_AGENT_WEBHOOK_URL = 'https://n8n-1prompt.99players.com/webhook/webinar-support-agent';

interface PresentationChatThread {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface PresentationChatMessage {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant';
  content: string;
  message_type: 'text';
  metadata?: any;
  created_at: string;
}

const predefinedQuestions = [
  "Help me create an engaging presentation outline",
  "What are the key points I should cover?",
  "Suggest compelling opening hooks for my presentation",
  "How can I make my slides more visual?",
  "What questions might the audience ask?",
  "Help me practice my delivery",
  "Create a summary of my main points",
  "Suggest ways to handle Q&A effectively"
];

export const PresentationAgentChatInterface: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { toast } = useToast();
  const [threads, setThreads] = useState<PresentationChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PresentationChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadLoading, setThreadLoading] = useState(false);
  const selectedModel = 'anthropic/claude-sonnet-4'; // Default model for presentation agent
  const [hasLLMConfig, setHasLLMConfig] = useState(false);

  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [thinkingMessageIndex, setThinkingMessageIndex] = useState(0);
  const thinkingMessages = [
    "AI is thinking...",
    "Processing your query...",
    "Preparing insights...",
    "Generating response...",
    "Almost there..."
  ];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Use dedicated presentation_chat tables (separate from prompt_chat)
  const threadsTable = 'presentation_chat_threads';
  const messagesTable = 'presentation_chat_messages';

  useEffect(() => {
    if (clientId) {
      fetchThreads();
      // Fetch LLM configuration status
      const fetchLLMConfig = async () => {
        try {
          const { data, error } = await supabase
            .from('clients')
            .select('openrouter_api_key, openai_api_key')
            .eq('id', clientId)
            .maybeSingle();
          if (!error && data) {
            const hasLLM = !!(data.openrouter_api_key || data.openai_api_key);
            setHasLLMConfig(hasLLM);
          }
        } catch (e) {
          console.error('Error fetching LLM config:', e);
        }
      };
      fetchLLMConfig();
    }
  }, [clientId]);

  useEffect(() => {
    if (activeThreadId) {
      fetchMessages(activeThreadId);
    } else {
      setMessages([]);
    }
  }, [activeThreadId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isLoading) scrollToBottom();
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) {
      setThinkingMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setThinkingMessageIndex(prev => (prev + 1) % thinkingMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isLoading]);

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior });
    }
  };

  const fetchThreads = async () => {
    if (!clientId) return;
    setThreadLoading(true);
    try {
      const { data, error } = await supabase
        .from(threadsTable)
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setThreads(data || []);

      if (!activeThreadId && data && data.length > 0) {
        setActiveThreadId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
      toast({
        title: "Error",
        description: "Failed to load chat threads.",
        variant: "destructive"
      });
    } finally {
      setThreadLoading(false);
    }
  };

  const fetchMessages = async (threadId: string) => {
    try {
      const { data, error } = await supabase
        .from(messagesTable)
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages((data || []) as PresentationChatMessage[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    }
  };

  const createNewThread = async (title?: string) => {
    if (!clientId) return;
    setThreadLoading(true);
    try {
      const { data, error } = await supabase
        .from(threadsTable)
        .insert([{
          client_id: clientId,
          title: (title || 'New Presentation Chat').slice(0, 50)
        }])
        .select()
        .single();
      if (error) throw error;
      await fetchThreads();
      setActiveThreadId(data.id);
      setMessages([]);
      toast({
        title: "Success",
        description: "New chat thread created"
      });
    } catch (error) {
      console.error('Error creating thread:', error);
      toast({
        title: "Error",
        description: "Failed to create new thread",
        variant: "destructive"
      });
    } finally {
      setThreadLoading(false);
    }
  };

  const updateThreadTitle = async (threadId: string, newTitle: string) => {
    try {
      const trimmedTitle = newTitle.trim().slice(0, 50);
      const { error } = await supabase
        .from(threadsTable)
        .update({ title: trimmedTitle })
        .eq('id', threadId);
      if (error) throw error;
      await fetchThreads();
      setEditingThreadId(null);
      toast({
        title: "Success",
        description: "Thread title updated"
      });
    } catch (error) {
      console.error('Error updating thread title:', error);
      toast({
        title: "Error",
        description: "Failed to update thread title",
        variant: "destructive"
      });
    }
  };

  const deleteThread = async (threadId: string) => {
    try {
      await supabase.from(messagesTable).delete().eq('thread_id', threadId);
      const { error } = await supabase.from(threadsTable).delete().eq('id', threadId);
      if (error) throw error;
      await fetchThreads();
      if (activeThreadId === threadId) {
        setActiveThreadId(null);
        setMessages([]);
      }
      toast({
        title: "Success",
        description: "Thread deleted"
      });
    } catch (error) {
      console.error('Error deleting thread:', error);
      toast({
        title: "Error",
        description: "Failed to delete thread",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !activeThreadId || !clientId) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    setIsLoading(true);
    
    // Reset textarea height to original size
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const { data: userMessageData, error: userMessageError } = await supabase
        .from(messagesTable)
        .insert([{
          thread_id: activeThreadId,
          role: 'user',
          content: userMessage,
          message_type: 'text',
          metadata: { model: selectedModel }
        }])
        .select()
        .single();
      if (userMessageError) throw userMessageError;

      setMessages(prev => [...prev, userMessageData as PresentationChatMessage]);

      const history = [...messages, { role: 'user' as const, content: userMessage }]
        .map(m => ({ role: m.role, content: m.content }));

      // Fetch client's OpenRouter API key
      const { data: clientData } = await supabase
        .from('clients')
        .select('openrouter_api_key')
        .eq('id', clientId)
        .single();

      const webhookResponse = await fetch(DEFAULT_PRESENTATION_AGENT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: history,
          clientId: clientId,
          threadId: activeThreadId,
          model: selectedModel,
          openrouter_api_key: clientData?.openrouter_api_key || null
        })
      });

      if (!webhookResponse.ok) {
        throw new Error(`Webhook responded with status: ${webhookResponse.status}`);
      }

      let aiResponseContent: string = '';
      let webhookData: any = null;
      const responseText = await webhookResponse.text();

      try {
        const contentType = webhookResponse.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          webhookData = JSON.parse(responseText);
          aiResponseContent = webhookData?.output ?? 
                             webhookData?.response ?? 
                             webhookData?.message ?? 
                             webhookData?.answer ?? 
                             webhookData?.text ?? 
                             webhookData?.content ?? 
                             webhookData?.result ??
                             webhookData?.data?.output ??
                             webhookData?.data?.response ??
                             webhookData?.choices?.[0]?.message?.content ?? 
                             (typeof webhookData === 'string' ? webhookData : null);
        } else {
          aiResponseContent = responseText;
        }
      } catch (parseError) {
        aiResponseContent = responseText;
      }

      if (!aiResponseContent || typeof aiResponseContent !== 'string') {
        aiResponseContent = `⚠️ Webhook Configuration Issue\n\nThe webhook responded but did not return text in the expected format.`;
      }

      const { data: aiMessageData, error: aiMessageError } = await supabase
        .from(messagesTable)
        .insert([{
          thread_id: activeThreadId,
          role: 'assistant',
          content: aiResponseContent,
          message_type: 'text',
          metadata: { webhookResponse: webhookData, model: selectedModel }
        }])
        .select()
        .single();

      if (aiMessageError) {
        console.error('Error saving AI response:', aiMessageError);
      }

      setMessages(prev => [...prev, aiMessageData as PresentationChatMessage]);

      await supabase.from(threadsTable).update({ updated_at: new Date().toISOString() }).eq('id', activeThreadId);
      fetchThreads();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive"
      });

      const errorMessage: PresentationChatMessage = {
        id: Date.now().toString(),
        thread_id: activeThreadId,
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        message_type: 'text',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
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
      toast({ title: "Copied!", description: "Text copied to clipboard" });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handlePredefinedQuestion = (question: string) => {
    if (!activeThreadId) {
      toast({
        title: "Select a thread first",
        description: "Please select or create a chat thread before asking questions",
        variant: "destructive"
      });
      return;
    }
    setCurrentMessage(question);
    setTimeout(() => sendMessage(), 50);
  };


  return (
    <div className="h-full min-h-0 overflow-hidden flex flex-col">
      <div className="flex-shrink-0">
        <ConfigStatusBar 
          configs={[
            {
              name: "LLM Configuration",
              isConfigured: hasLLMConfig,
              description: hasLLMConfig 
                ? "Configured" 
                : "Not configured - OpenAI or OpenRouter API key required",
              scrollToId: "llm-configuration"
            }
          ]}
        />
      </div>

      {/* Header with History title and New Chat button */}
      <div className="flex items-center justify-between flex-shrink-0 mb-4">
        <h2 className="text-lg font-semibold">History</h2>
        <Button onClick={() => createNewThread()} size="sm" className="flex items-center gap-2" disabled={threadLoading || !hasLLMConfig}>
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Main Content - History sidebar and Chat aligned */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0 overflow-hidden">
        {/* Chat Threads Sidebar */}
        <Card className="lg:col-span-1 material-surface flex flex-col h-full min-h-0 overflow-hidden">
          <CardContent className="p-0 flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Chat Threads - Scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
              <div className="space-y-2">
                {threads.map(thread => (
                  <div
                    key={thread.id}
                    className={`group relative p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                      activeThreadId === thread.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setActiveThreadId(thread.id)}
                  >
                    {editingThreadId === thread.id ? (
                      <div className="space-y-1">
                        <Input
                          value={editingTitle}
                          onChange={e => setEditingTitle(e.target.value.slice(0, 50))}
                          onBlur={() => {
                            if (editingTitle.trim()) {
                              updateThreadTitle(thread.id, editingTitle.trim());
                            } else {
                              setEditingThreadId(null);
                            }
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && editingTitle.trim()) {
                              updateThreadTitle(thread.id, editingTitle.trim());
                            } else if (e.key === 'Escape') {
                              setEditingThreadId(null);
                            }
                          }}
                          className="h-6 text-sm"
                          autoFocus
                          maxLength={50}
                        />
                        <p className="text-xs text-muted-foreground text-right">{editingTitle.length}/50</p>
                      </div>
                    ) : (
                      <div className="pr-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium text-sm truncate">{thread.title}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {new Date(thread.updated_at).toLocaleDateString()}
                          </p>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ml-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0 hover:bg-primary/20"
                              onClick={e => {
                                e.stopPropagation();
                                setEditingThreadId(thread.id);
                                setEditingTitle(thread.title);
                              }}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0 text-destructive hover:bg-destructive/20"
                              onClick={e => {
                                e.stopPropagation();
                                deleteThread(thread.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="lg:col-span-3 material-surface flex flex-col h-full min-h-0">
          <CardContent className="flex flex-col flex-1 min-h-0 p-4">
            {/* Chat Messages - Full height scrollable area */}
            <div ref={scrollContainerRef} className="flex-1 border rounded-md p-4 bg-background/50 overflow-y-auto mb-4">
              <div className="space-y-4">
                {!activeThreadId ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <div className="max-w-md mx-auto">
                      <MessageSquare className="h-16 w-16 mx-auto mb-6 opacity-30" />
                      <h3 className="text-xl font-semibold mb-3 text-foreground">Welcome to Presentation Agent</h3>
                      <p className="text-sm mb-6 leading-relaxed">
                        Get AI-powered help with your presentations. Create engaging content, practice delivery, and prepare for Q&A.
                      </p>
                      <div className="grid grid-cols-1 gap-3 text-left">
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                          <h4 className="font-medium text-sm text-primary mb-2">💡 What you can ask:</h4>
                          <ul className="text-xs space-y-1 text-muted-foreground">
                            <li>• "Help me create an engaging presentation outline"</li>
                            <li>• "Suggest compelling opening hooks"</li>
                            <li>• "What questions might the audience ask?"</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="max-w-2xl mx-auto">
                      <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-3 text-foreground">Ready to Help with Your Presentation</h3>
                      <p className="text-sm mb-6 leading-relaxed">
                        I can help you create, refine, and practice your presentations.
                      </p>
                      <div className="text-left">
                        <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Quick Questions
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {predefinedQuestions.map((question, index) => (
                            <button
                              key={index}
                              onClick={() => handlePredefinedQuestion(question)}
                              disabled={isLoading || !activeThreadId}
                              className="text-left text-sm p-3 bg-muted/50 hover:bg-primary/10 border rounded-lg transition-all hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                              <div className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-primary/40 rounded-full flex-shrink-0 mt-1.5 group-hover:bg-primary transition-colors" />
                                <span className="leading-5">{question}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  messages.map(message => (
                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                      <div className={`max-w-[85%] rounded-lg px-4 py-3 ${
                        message.role === 'user' ? 'bg-primary text-primary-foreground ml-4' : 'bg-card border shadow-sm mr-4'
                      }`}>
                        {message.role === 'user' ? (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        ) : (
                          <div className="prose prose-sm max-w-none dark:prose-invert text-sm leading-relaxed">
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
                                  const isInlineCode = !className;
                                  return isInlineCode ? (
                                    <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                                  ) : (
                                    <code className="block bg-muted/80 p-4 rounded-lg text-xs font-mono border overflow-x-auto my-3">{children}</code>
                                  );
                                },
                                pre: ({ children }) => <div className="bg-muted/80 p-4 rounded-lg border overflow-x-auto my-3">{children}</div>,
                                blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/50 pl-4 italic my-3 text-foreground/80 bg-primary/5 py-2 rounded-r">{children}</blockquote>,
                                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                                em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
                                a: ({ children, href }) => <a href={href} className="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer">{children}</a>,
                                table: ({ children }) => (
                                  <div className="overflow-x-auto my-4 rounded-lg border border-border shadow-sm">
                                    <table className="min-w-full border-collapse bg-card">{children}</table>
                                  </div>
                                ),
                                thead: ({ children }) => <thead className="bg-primary/10 border-b-2 border-primary/20">{children}</thead>,
                                tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
                                tr: ({ children }) => <tr className="hover:bg-muted/50 transition-colors">{children}</tr>,
                                th: ({ children }) => <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground">{children}</th>,
                                td: ({ children }) => <td className="px-4 py-3 text-sm text-foreground/90">{children}</td>,
                                hr: () => <hr className="my-4 border-border" />
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs opacity-70 flex items-center gap-1">
                            {message.role === 'user' ? (
                              <>
                                <User className="w-3 h-3" />
                                <span>You</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3" />
                                <span>AI</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{new Date(message.created_at).toLocaleTimeString()}</span>
                          </p>
                          {message.role === 'assistant' && (
                            <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => copyToClipboard(message.content)}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {isLoading && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="bg-muted border rounded-lg px-4 py-3 mr-4">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">{thinkingMessages[thinkingMessageIndex]}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area - Fixed at bottom */}
            <div className="flex-shrink-0">
              <div className="flex gap-2 items-center">
                <Input
                  value={currentMessage}
                  onChange={e => setCurrentMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={
                    !hasLLMConfig 
                      ? "Configure LLM settings first..." 
                      : activeThreadId 
                        ? "Ask about your presentation..." 
                        : "Select a thread first..."
                  }
                  disabled={isLoading || !activeThreadId || !hasLLMConfig}
                  className="flex-1 !h-8"
                  style={{ fontSize: '13px' }}
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !currentMessage.trim() || !activeThreadId || !hasLLMConfig}
                  size="sm"
                  className="shrink-0"
                >
                  {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : <><Send className="w-4 h-4 mr-2" />Send</>}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PresentationAgentChatInterface;
