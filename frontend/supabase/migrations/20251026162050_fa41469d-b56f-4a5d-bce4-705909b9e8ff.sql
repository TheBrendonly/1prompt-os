-- Create voice_chat_analytics table (identical structure to chat_analytics)
CREATE TABLE IF NOT EXISTS public.voice_chat_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL,
  time_range text NOT NULL DEFAULT '7'::text,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT voice_chat_analytics_client_time_range_unique UNIQUE (client_id, time_range)
);

-- Enable RLS
ALTER TABLE public.voice_chat_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for voice_chat_analytics (same as chat_analytics)
CREATE POLICY "Users can view voice analytics for their agency clients"
  ON public.voice_chat_analytics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN profiles ON profiles.agency_id = clients.agency_id
      WHERE profiles.id = auth.uid()
      AND clients.id = voice_chat_analytics.client_id
    )
  );

CREATE POLICY "Users can create voice analytics for their agency clients"
  ON public.voice_chat_analytics
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      JOIN profiles ON profiles.agency_id = clients.agency_id
      WHERE profiles.id = auth.uid()
      AND clients.id = voice_chat_analytics.client_id
    )
  );

CREATE POLICY "Users can update voice analytics for their agency clients"
  ON public.voice_chat_analytics
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN profiles ON profiles.agency_id = clients.agency_id
      WHERE profiles.id = auth.uid()
      AND clients.id = voice_chat_analytics.client_id
    )
  );

CREATE POLICY "Users can delete voice analytics for their agency clients"
  ON public.voice_chat_analytics
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN profiles ON profiles.agency_id = clients.agency_id
      WHERE profiles.id = auth.uid()
      AND clients.id = voice_chat_analytics.client_id
    )
  );

-- Create voice analytics chat threads table
CREATE TABLE IF NOT EXISTS public.voice_analytics_chat_threads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New Voice Chat'::text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voice_analytics_chat_threads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for voice_analytics_chat_threads
CREATE POLICY "Users can view voice analytics chat threads for their agency clients"
  ON public.voice_analytics_chat_threads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN profiles ON profiles.agency_id = clients.agency_id
      WHERE profiles.id = auth.uid()
      AND clients.id = voice_analytics_chat_threads.client_id
    )
  );

CREATE POLICY "Users can create voice analytics chat threads for their agency client"
  ON public.voice_analytics_chat_threads
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      JOIN profiles ON profiles.agency_id = clients.agency_id
      WHERE profiles.id = auth.uid()
      AND clients.id = voice_analytics_chat_threads.client_id
    )
  );

CREATE POLICY "Users can update voice analytics chat threads for their agency client"
  ON public.voice_analytics_chat_threads
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN profiles ON profiles.agency_id = clients.agency_id
      WHERE profiles.id = auth.uid()
      AND clients.id = voice_analytics_chat_threads.client_id
    )
  );

CREATE POLICY "Users can delete voice analytics chat threads for their agency client"
  ON public.voice_analytics_chat_threads
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN profiles ON profiles.agency_id = clients.agency_id
      WHERE profiles.id = auth.uid()
      AND clients.id = voice_analytics_chat_threads.client_id
    )
  );

-- Create voice analytics chat messages table
CREATE TABLE IF NOT EXISTS public.voice_analytics_chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id uuid NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'text'::text,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voice_analytics_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for voice_analytics_chat_messages
CREATE POLICY "Users can view voice analytics chat messages for accessible threads"
  ON public.voice_analytics_chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM voice_analytics_chat_threads vact
      JOIN clients ON clients.id = vact.client_id
      JOIN profiles ON profiles.agency_id = clients.agency_id
      WHERE profiles.id = auth.uid()
      AND vact.id = voice_analytics_chat_messages.thread_id
    )
  );

CREATE POLICY "Users can create voice analytics chat messages for accessible threads"
  ON public.voice_analytics_chat_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM voice_analytics_chat_threads vact
      JOIN clients ON clients.id = vact.client_id
      JOIN profiles ON profiles.agency_id = clients.agency_id
      WHERE profiles.id = auth.uid()
      AND vact.id = voice_analytics_chat_messages.thread_id
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS voice_chat_analytics_client_id_idx ON public.voice_chat_analytics(client_id);
CREATE INDEX IF NOT EXISTS voice_chat_analytics_time_range_idx ON public.voice_chat_analytics(time_range);
CREATE INDEX IF NOT EXISTS voice_analytics_chat_threads_client_id_idx ON public.voice_analytics_chat_threads(client_id);
CREATE INDEX IF NOT EXISTS voice_analytics_chat_messages_thread_id_idx ON public.voice_analytics_chat_messages(thread_id);