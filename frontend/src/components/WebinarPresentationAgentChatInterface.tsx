import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Send, Plus, User, Copy, Loader2, Trash2, Edit, Sparkles, Presentation } from '@/components/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Webhook URL for webinar presentation agent
const WEBINAR_PRESENTATION_AGENT_WEBHOOK_URL = 'https://n8n-1prompt.99players.com/webhook/webinar-presentation-agent';
interface WebinarPresentationChatThread {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}
interface WebinarPresentationChatMessage {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant';
  content: string;
  message_type: 'text';
  metadata?: any;
  created_at: string;
}
const predefinedQuestions = ["Help me create an engaging webinar presentation outline", "What are the key points I should cover in my webinar?", "Suggest compelling opening hooks for my webinar", "How can I make my webinar slides more engaging?", "What questions might the audience ask during my webinar?", "Help me practice my webinar delivery", "Create a summary of my webinar main points", "Suggest ways to handle Q&A effectively in my webinar"];
export const WebinarPresentationAgentChatInterface: React.FC = () => {
  const {
    clientId
  } = useParams<{
    clientId: string;
  }>();
  const {
    toast
  } = useToast();
  const [threads, setThreads] = useState<WebinarPresentationChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WebinarPresentationChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadLoading, setThreadLoading] = useState(false);
  const selectedModel = 'anthropic/claude-sonnet-4'; // Default model

  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [thinkingMessageIndex, setThinkingMessageIndex] = useState(0);
  const thinkingMessages = ["AI is thinking...", "Processing your query...", "Preparing insights...", "Generating response...", "Almost there..."];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Use dedicated presentation_chat tables (shared with existing presentation agent)
  const threadsTable = 'presentation_chat_threads';
  const messagesTable = 'presentation_chat_messages';
  useEffect(() => {
    if (clientId) {
      fetchThreads();
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
      el.scrollTo({
        top: el.scrollHeight,
        behavior
      });
    }
  };
  const fetchThreads = async () => {
    if (!clientId) return;
    setThreadLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.from(threadsTable).select('*').eq('client_id', clientId).eq('is_active', true).order('updated_at', {
        ascending: false
      });
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
      const {
        data,
        error
      } = await supabase.from(messagesTable).select('*').eq('thread_id', threadId).order('created_at', {
        ascending: true
      });
      if (error) throw error;
      setMessages((data || []) as WebinarPresentationChatMessage[]);
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
      const {
        data,
        error
      } = await supabase.from(threadsTable).insert([{
        client_id: clientId,
        title: (title || 'New Webinar Chat').slice(0, 50)
      }]).select().single();
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
      const {
        error
      } = await supabase.from(threadsTable).update({
        title: trimmedTitle
      }).eq('id', threadId);
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
      const {
        error
      } = await supabase.from(threadsTable).delete().eq('id', threadId);
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
      const {
        data: userMessageData,
        error: userMessageError
      } = await supabase.from(messagesTable).insert([{
        thread_id: activeThreadId,
        role: 'user',
        content: userMessage,
        message_type: 'text',
        metadata: {
          model: selectedModel
        }
      }]).select().single();
      if (userMessageError) throw userMessageError;
      setMessages(prev => [...prev, userMessageData as WebinarPresentationChatMessage]);
      const history = [...messages, {
        role: 'user' as const,
        content: userMessage
      }].map(m => ({
        role: m.role,
        content: m.content
      }));

      // Fetch client's OpenRouter API key
      const {
        data: clientData
      } = await supabase.from('clients').select('openrouter_api_key').eq('id', clientId).single();
      const webhookResponse = await fetch(WEBINAR_PRESENTATION_AGENT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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
          aiResponseContent = webhookData?.output ?? webhookData?.response ?? webhookData?.message ?? webhookData?.answer ?? webhookData?.text ?? webhookData?.content ?? webhookData?.result ?? webhookData?.data?.output ?? webhookData?.data?.response ?? webhookData?.choices?.[0]?.message?.content ?? (typeof webhookData === 'string' ? webhookData : null);
        } else {
          aiResponseContent = responseText;
        }
      } catch (parseError) {
        aiResponseContent = responseText;
      }
      if (!aiResponseContent || typeof aiResponseContent !== 'string') {
        aiResponseContent = `⚠️ Webhook Configuration Issue\n\nThe webhook responded but did not return text in the expected format.`;
      }
      const {
        data: aiMessageData,
        error: aiMessageError
      } = await supabase.from(messagesTable).insert([{
        thread_id: activeThreadId,
        role: 'assistant',
        content: aiResponseContent,
        message_type: 'text',
        metadata: {
          webhookResponse: webhookData,
          model: selectedModel
        }
      }]).select().single();
      if (aiMessageError) {
        console.error('Error saving AI response:', aiMessageError);
      }
      setMessages(prev => [...prev, aiMessageData as WebinarPresentationChatMessage]);
      await supabase.from(threadsTable).update({
        updated_at: new Date().toISOString()
      }).eq('id', activeThreadId);
      fetchThreads();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive"
      });
      const errorMessage: WebinarPresentationChatMessage = {
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
      toast({
        title: "Copied!",
        description: "Text copied to clipboard"
      });
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
  return <div className="h-full min-h-0 overflow-hidden flex flex-col">

      {/* Header with History title and New Chat button */}
      <div className="flex items-center justify-between flex-shrink-0 mb-4">
        <div className="flex items-center gap-2">
          <Presentation className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Webinar Presentation Agent</h2>
        </div>
        <Button onClick={() => createNewThread()} size="sm" className="flex items-center gap-2" disabled={threadLoading}>
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Main Content - History sidebar and Chat aligned */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 flex-1 min-h-0 overflow-hidden">
        {/* Chat Threads Sidebar */}
        <Card className="lg:col-span-1 material-surface flex flex-col h-full min-h-0 overflow-hidden">
          <CardContent className="p-0 flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Chat Threads - Scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
              <div className="space-y-2">
                {threads.map(thread => <div key={thread.id} className={`group relative p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${activeThreadId === thread.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}`} onClick={() => setActiveThreadId(thread.id)}>
                    {editingThreadId === thread.id ? <div className="space-y-1">
                        <Input value={editingTitle} onChange={e => setEditingTitle(e.target.value.slice(0, 50))} onBlur={() => {
                    if (editingTitle.trim()) {
                      updateThreadTitle(thread.id, editingTitle.trim());
                    } else {
                      setEditingThreadId(null);
                    }
                  }} onKeyDown={e => {
                    if (e.key === 'Enter' && editingTitle.trim()) {
                      updateThreadTitle(thread.id, editingTitle.trim());
                    } else if (e.key === 'Escape') {
                      setEditingThreadId(null);
                    }
                  }} className="h-6 text-sm" autoFocus maxLength={50} />
                        <p className="text-xs text-muted-foreground text-right">{editingTitle.length}/50</p>
                      </div> : <div className="pr-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium text-sm truncate">{thread.title}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {new Date(thread.updated_at).toLocaleDateString()}
                          </p>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ml-2">
                            <Button size="sm" variant="ghost" className="h-5 w-5 p-0 hover:bg-primary/20" onClick={e => {
                        e.stopPropagation();
                        setEditingThreadId(thread.id);
                        setEditingTitle(thread.title);
                      }}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-5 w-5 p-0 hover:bg-destructive/20 text-destructive" onClick={e => {
                        e.stopPropagation();
                        deleteThread(thread.id);
                      }}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>}
                  </div>)}
                {threads.length === 0 && !threadLoading && <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No chat threads yet</p>
                    <p className="text-xs">Click "New Chat" to start</p>
                  </div>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="lg:col-span-3 material-surface flex flex-col h-full min-h-0 overflow-hidden">
          <CardContent className="p-0 flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Messages Area */}
            <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
              {!activeThreadId ? <div className="h-full flex flex-col items-center justify-center text-center">
                  <Presentation className="w-16 h-16 text-primary/30 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Welcome to Webinar Presentation Agent
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mb-6">
                    Your AI assistant for creating engaging webinar presentations. 
                    Select a chat thread or create a new one to get started.
                  </p>
                  
                  {/* Quick Start Questions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl">
                    {predefinedQuestions.slice(0, 4).map((question, index) => <Button key={index} variant="outline" size="sm" className="text-left h-auto py-2 px-3 justify-start" onClick={() => {
                  if (!activeThreadId) {
                    createNewThread().then(() => {
                      setTimeout(() => handlePredefinedQuestion(question), 500);
                    });
                  } else {
                    handlePredefinedQuestion(question);
                  }
                }} disabled={false}>
                        <Sparkles className="w-3 h-3 mr-2 flex-shrink-0" />
                        <span className="text-xs truncate">{question}</span>
                      </Button>)}
                  </div>
                </div> : <>
                  {messages.map(msg => <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Sparkles className="w-4 h-4 text-primary-foreground" />
                        </div>}
                      <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                        <div className={`rounded-xl px-4 py-2.5 shadow-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-card border border-border'}`}>
                          {msg.role === 'assistant' ? <div className="prose prose-xs dark:prose-invert max-w-none text-foreground text-sm
                            [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
                            [&_p]:leading-relaxed [&_p]:my-1.5 [&_p]:text-sm
                            [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_table]:rounded-lg [&_table]:overflow-hidden [&_table]:text-sm
                            [&_th]:bg-primary/10 [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground [&_th]:text-sm
                            [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:text-foreground [&_td]:text-sm
                            [&_tr:nth-child(even)]:bg-muted/40 [&_tr:hover]:bg-muted/60 [&_tr]:transition-colors
                            [&_pre]:bg-muted/80 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-3 [&_pre]:border [&_pre]:border-border [&_pre]:text-xs
                            [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_code]:text-primary
                            [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-foreground
                            [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-3 [&_img]:shadow-md [&_img]:border [&_img]:border-border
                            [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:bg-primary/5 [&_blockquote]:pl-3 [&_blockquote]:pr-3 [&_blockquote]:py-1.5 [&_blockquote]:italic [&_blockquote]:my-3 [&_blockquote]:rounded-r-lg [&_blockquote]:text-sm
                            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ul]:space-y-0.5 [&_ul]:text-sm
                            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_ol]:space-y-0.5 [&_ol]:text-sm
                            [&_li]:my-0.5 [&_li]:leading-relaxed [&_li]:text-sm
                            [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-foreground [&_h1]:border-b [&_h1]:border-border [&_h1]:pb-1.5
                            [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h2]:text-foreground
                            [&_h3]:text-sm [&_h3]:font-medium [&_h3]:mt-2.5 [&_h3]:mb-1 [&_h3]:text-foreground
                            [&_h4]:text-sm [&_h4]:font-medium [&_h4]:mt-2 [&_h4]:mb-1 [&_h4]:text-foreground
                            [&_hr]:my-4 [&_hr]:border-border
                            [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a]:font-medium [&_a]:text-sm hover:[&_a]:text-primary/80
                            [&_strong]:font-semibold [&_strong]:text-foreground
                            [&_em]:italic
                            [&_del]:line-through [&_del]:text-muted-foreground
                            [&_mark]:bg-yellow-200 [&_mark]:dark:bg-yellow-900 [&_mark]:px-1 [&_mark]:rounded
                            [&_sub]:text-xs [&_sup]:text-xs
                            [&_details]:my-3 [&_details]:border [&_details]:border-border [&_details]:rounded-lg [&_details]:p-2.5 [&_details]:text-sm
                            [&_summary]:cursor-pointer [&_summary]:font-medium [&_summary]:text-sm
                            [&_kbd]:bg-muted [&_kbd]:border [&_kbd]:border-border [&_kbd]:rounded [&_kbd]:px-1 [&_kbd]:py-0.5 [&_kbd]:text-xs [&_kbd]:font-mono
                          ">
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  img: ({ node, ...props }) => (
                                    <img {...props} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                  ),
                                  a: ({ node, ...props }) => (
                                    <a {...props} target="_blank" rel="noopener noreferrer" />
                                  ),
                                  pre: ({ node, children, ...props }) => (
                                    <div className="relative group">
                                      <pre {...props}>{children}</pre>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80"
                                        onClick={() => {
                                          const code = (children as any)?.props?.children || '';
                                          copyToClipboard(typeof code === 'string' ? code : '');
                                        }}
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  ),
                                  table: ({ node, ...props }) => (
                                    <div className="overflow-x-auto my-4 rounded-lg border border-border">
                                      <table {...props} />
                                    </div>
                                  ),
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>
                            </div> : <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                        </div>
                        {msg.role === 'assistant' && <div className="flex gap-1 mt-1.5">
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground" onClick={() => copyToClipboard(msg.content)}>
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </Button>
                          </div>}
                      </div>
                      {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary-foreground" />
                        </div>}
                    </div>)}
                  
                  {/* Loading indicator */}
                  {isLoading && <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                      <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">
                          {thinkingMessages[thinkingMessageIndex]}
                        </span>
                      </div>
                    </div>}
                  <div ref={messagesEndRef} />
                </>}
            </div>

            {/* Input Area */}
            {activeThreadId && <div className="flex-shrink-0 p-4 border-t">
                <div className="flex gap-2">
                  <Textarea ref={textareaRef} value={currentMessage} onChange={e => setCurrentMessage(e.target.value)} onKeyDown={handleKeyPress} placeholder="Ask about your webinar presentation..." className="min-h-[60px] max-h-[180px] resize-none" disabled={isLoading} style={{ height: 'auto', overflow: 'hidden' }} onInput={e => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    const newHeight = Math.min(target.scrollHeight, 180);
                    target.style.height = newHeight + 'px';
                  }} />
                  <Button onClick={sendMessage} disabled={!currentMessage.trim() || isLoading} className="h-[60px] py-0 px-[18px]">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>}
          </CardContent>
        </Card>
      </div>
    </div>;
};