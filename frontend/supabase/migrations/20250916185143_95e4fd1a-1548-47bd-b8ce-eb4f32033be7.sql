-- Create analytics chat threads table
CREATE TABLE public.analytics_chat_threads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New Chat',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create analytics chat messages table  
CREATE TABLE public.analytics_chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'text',
  metadata jsonb NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics chat threads
CREATE POLICY "Users can create analytics chat threads for their agency clients" 
ON public.analytics_chat_threads 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1
  FROM clients
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = analytics_chat_threads.client_id
));

CREATE POLICY "Users can view analytics chat threads for their agency clients" 
ON public.analytics_chat_threads 
FOR SELECT 
USING (EXISTS (
  SELECT 1
  FROM clients
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = analytics_chat_threads.client_id
));

CREATE POLICY "Users can update analytics chat threads for their agency clients" 
ON public.analytics_chat_threads 
FOR UPDATE 
USING (EXISTS (
  SELECT 1
  FROM clients
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = analytics_chat_threads.client_id
));

CREATE POLICY "Users can delete analytics chat threads for their agency clients" 
ON public.analytics_chat_threads 
FOR DELETE 
USING (EXISTS (
  SELECT 1
  FROM clients
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = analytics_chat_threads.client_id
));

-- Create policies for analytics chat messages
CREATE POLICY "Users can create analytics chat messages for accessible threads" 
ON public.analytics_chat_messages 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1
  FROM analytics_chat_threads act
  JOIN clients ON clients.id = act.client_id
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND act.id = analytics_chat_messages.thread_id
));

CREATE POLICY "Users can view analytics chat messages for accessible threads" 
ON public.analytics_chat_messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1
  FROM analytics_chat_threads act
  JOIN clients ON clients.id = act.client_id
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND act.id = analytics_chat_messages.thread_id
));

-- Add triggers for updated_at
CREATE TRIGGER update_analytics_chat_threads_updated_at
BEFORE UPDATE ON public.analytics_chat_threads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();