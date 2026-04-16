-- Create table for storing chat analytics data
CREATE TABLE IF NOT EXISTS public.chat_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  time_range TEXT NOT NULL DEFAULT '7',
  metrics JSONB NOT NULL DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for chat analytics
CREATE POLICY "Users can view analytics for their agency clients" 
ON public.chat_analytics 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM clients
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() 
  AND clients.id = chat_analytics.client_id
));

CREATE POLICY "Users can create analytics for their agency clients" 
ON public.chat_analytics 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM clients
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() 
  AND clients.id = chat_analytics.client_id
));

CREATE POLICY "Users can update analytics for their agency clients" 
ON public.chat_analytics 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM clients
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() 
  AND clients.id = chat_analytics.client_id
));

CREATE POLICY "Users can delete analytics for their agency clients" 
ON public.chat_analytics 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM clients
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() 
  AND clients.id = chat_analytics.client_id
));

-- Create table for storing chat analytics messages
CREATE TABLE IF NOT EXISTS public.chat_analytics_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_analytics_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chat analytics messages
CREATE POLICY "Users can view messages for their agency clients" 
ON public.chat_analytics_messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM clients
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() 
  AND clients.id = chat_analytics_messages.client_id
));

CREATE POLICY "Users can create messages for their agency clients" 
ON public.chat_analytics_messages 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM clients
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() 
  AND clients.id = chat_analytics_messages.client_id
));

CREATE POLICY "Users can delete messages for their agency clients" 
ON public.chat_analytics_messages 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM clients
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() 
  AND clients.id = chat_analytics_messages.client_id
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_chat_analytics_updated_at
BEFORE UPDATE ON public.chat_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_analytics_client_id ON public.chat_analytics(client_id);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_messages_client_id ON public.chat_analytics_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_messages_timestamp ON public.chat_analytics_messages(timestamp DESC);