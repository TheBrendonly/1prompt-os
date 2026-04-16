-- Create presentation_chat_threads table
CREATE TABLE public.presentation_chat_threads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New Presentation Chat',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create presentation_chat_messages table
CREATE TABLE public.presentation_chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id uuid NOT NULL REFERENCES public.presentation_chat_threads(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'text',
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.presentation_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentation_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for presentation_chat_threads
CREATE POLICY "Users can view presentation threads for their agency clients"
ON public.presentation_chat_threads FOR SELECT
USING (EXISTS (
  SELECT 1 FROM clients JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = presentation_chat_threads.client_id
));

CREATE POLICY "Users can create presentation threads for their agency clients"
ON public.presentation_chat_threads FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM clients JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = presentation_chat_threads.client_id
));

CREATE POLICY "Users can update presentation threads for their agency clients"
ON public.presentation_chat_threads FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM clients JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = presentation_chat_threads.client_id
));

CREATE POLICY "Users can delete presentation threads for their agency clients"
ON public.presentation_chat_threads FOR DELETE
USING (EXISTS (
  SELECT 1 FROM clients JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = presentation_chat_threads.client_id
));

-- RLS policies for presentation_chat_messages
CREATE POLICY "Users can view presentation messages for accessible threads"
ON public.presentation_chat_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM presentation_chat_threads pct
  JOIN clients ON clients.id = pct.client_id
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND pct.id = presentation_chat_messages.thread_id
));

CREATE POLICY "Users can create presentation messages for accessible threads"
ON public.presentation_chat_messages FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM presentation_chat_threads pct
  JOIN clients ON clients.id = pct.client_id
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND pct.id = presentation_chat_messages.thread_id
));