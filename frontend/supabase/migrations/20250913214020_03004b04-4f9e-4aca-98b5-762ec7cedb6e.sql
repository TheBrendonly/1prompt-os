-- Create chat threads table for AI prompt generation conversations
CREATE TABLE public.prompt_chat_threads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New Chat',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

-- Create chat messages table
CREATE TABLE public.prompt_chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id uuid NOT NULL REFERENCES public.prompt_chat_threads(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'prompt_generation')),
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.prompt_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for prompt_chat_threads
CREATE POLICY "Users can create chat threads for their agency clients" 
ON public.prompt_chat_threads 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1
  FROM clients
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = prompt_chat_threads.client_id
));

CREATE POLICY "Users can view chat threads for their agency clients" 
ON public.prompt_chat_threads 
FOR SELECT 
USING (EXISTS (
  SELECT 1
  FROM clients
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = prompt_chat_threads.client_id
));

CREATE POLICY "Users can update chat threads for their agency clients" 
ON public.prompt_chat_threads 
FOR UPDATE 
USING (EXISTS (
  SELECT 1
  FROM clients
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = prompt_chat_threads.client_id
));

CREATE POLICY "Users can delete chat threads for their agency clients" 
ON public.prompt_chat_threads 
FOR DELETE 
USING (EXISTS (
  SELECT 1
  FROM clients
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = prompt_chat_threads.client_id
));

-- RLS policies for prompt_chat_messages
CREATE POLICY "Users can create messages for accessible threads" 
ON public.prompt_chat_messages 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1
  FROM prompt_chat_threads pct
  JOIN clients ON clients.id = pct.client_id
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND pct.id = prompt_chat_messages.thread_id
));

CREATE POLICY "Users can view messages for accessible threads" 
ON public.prompt_chat_messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1
  FROM prompt_chat_threads pct
  JOIN clients ON clients.id = pct.client_id
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND pct.id = prompt_chat_messages.thread_id
));

-- Create triggers for updated_at
CREATE TRIGGER update_prompt_chat_threads_updated_at
BEFORE UPDATE ON public.prompt_chat_threads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_prompt_chat_threads_client_id ON public.prompt_chat_threads(client_id);
CREATE INDEX idx_prompt_chat_messages_thread_id ON public.prompt_chat_messages(thread_id);
CREATE INDEX idx_prompt_chat_messages_created_at ON public.prompt_chat_messages(created_at);