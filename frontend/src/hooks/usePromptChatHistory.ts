import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface PromptChatMessageRow {
  role: 'user' | 'assistant';
  content: string | null;
  created_at: string;
}

interface PromptChatThreadRow {
  id: string;
  created_at: string;
}

export function usePromptChatHistory(clientId: string | undefined, slotId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    if (!clientId || !slotId) {
      setMessages([]);
      setThreadId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: threads, error: threadError } = await (supabase as any)
        .from('prompt_chat_threads')
        .select('id, created_at')
        .eq('client_id', clientId)
        .eq('title', `prompt-ai-${slotId}`)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (threadError) throw threadError;

      const typedThreads = (threads || []) as PromptChatThreadRow[];

      if (typedThreads.length === 0) {
        setMessages([]);
        setThreadId(null);
        return;
      }

      const latestThreadId = typedThreads[0].id;
      const threadIds = typedThreads.map(thread => thread.id);

      setThreadId(latestThreadId);

      const { data: rawMessages, error: messageError } = await (supabase as any)
        .from('prompt_chat_messages')
        .select('role, content, created_at')
        .in('thread_id', threadIds)
        .order('created_at', { ascending: true });

      if (messageError) throw messageError;

      const typedMessages = (rawMessages || []) as PromptChatMessageRow[];

      setMessages(
        typedMessages
          .filter((message) => typeof message.content === 'string' && message.content.trim().length > 0)
          .map((message) => ({
            role: message.role,
            content: message.content as string,
          }))
      );
    } catch (err) {
      console.error('Error loading prompt chat history:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId, slotId]);

  // Removed eager clear on slotId change to prevent flicker — loadHistory handles it

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const getOrCreateThreadId = useCallback(async () => {
    if (!clientId || !slotId) return null;

    if (threadId) return threadId;

    const { data: existingThreads, error: existingThreadError } = await (supabase as any)
      .from('prompt_chat_threads')
      .select('id, created_at')
      .eq('client_id', clientId)
      .eq('title', `prompt-ai-${slotId}`)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingThreadError) throw existingThreadError;

    const latestExistingThreadId = existingThreads?.[0]?.id ?? null;

    if (latestExistingThreadId) {
      setThreadId(latestExistingThreadId);
      return latestExistingThreadId;
    }

    const { data, error } = await (supabase as any)
      .from('prompt_chat_threads')
      .insert({
        client_id: clientId,
        title: `prompt-ai-${slotId}`,
        is_active: true,
      })
      .select('id')
      .single();

    if (error) throw error;

    setThreadId(data.id);
    return data.id as string;
  }, [clientId, slotId, threadId]);

  const addMessage = useCallback(async (msg: ChatMessage) => {
    if (!clientId || !slotId) return;

    try {
      const resolvedThreadId = await getOrCreateThreadId();
      if (!resolvedThreadId) return;

      const { error } = await (supabase as any)
        .from('prompt_chat_messages')
        .insert({
          thread_id: resolvedThreadId,
          role: msg.role,
          content: msg.content,
        });

      if (error) throw error;

      setMessages((prev) => [...prev, msg]);
    } catch (err) {
      console.error('Error saving chat message:', err);
    }
  }, [clientId, slotId, getOrCreateThreadId]);

  return { messages, setMessages, addMessage, loading };
}
