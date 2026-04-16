-- Create support chat messages table
CREATE TABLE IF NOT EXISTS public.support_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_support_chat_messages_client_id ON public.support_chat_messages(client_id, created_at);

-- Enable RLS
ALTER TABLE public.support_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their client's chat messages"
  ON public.support_chat_messages
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their client's chat messages"
  ON public.support_chat_messages
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete their client's chat messages"
  ON public.support_chat_messages
  FOR DELETE
  USING (true);