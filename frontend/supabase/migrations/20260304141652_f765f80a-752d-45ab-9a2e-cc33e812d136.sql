
-- Create execution_logs table
CREATE TABLE public.execution_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  webhook_response text,
  error_details text,
  retry_count integer NOT NULL DEFAULT 0,
  execution_time timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.execution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage execution logs for their campaigns"
ON public.execution_logs
FOR ALL
TO authenticated
USING (campaign_id IN (
  SELECT campaigns.id FROM campaigns
  WHERE campaigns.client_id IN (
    SELECT clients.id FROM clients
    WHERE clients.agency_id IN (
      SELECT profiles.agency_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  )
));

-- Create chat_analytics table
CREATE TABLE public.chat_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  time_range text NOT NULL,
  metrics jsonb DEFAULT '{}'::jsonb,
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(client_id, time_range)
);

ALTER TABLE public.chat_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage chat analytics for their clients"
ON public.chat_analytics
FOR ALL
TO authenticated
USING (client_id IN (
  SELECT clients.id FROM clients
  WHERE clients.agency_id IN (
    SELECT profiles.agency_id FROM profiles
    WHERE profiles.id = auth.uid()
  )
));

-- Create voice_chat_analytics table
CREATE TABLE public.voice_chat_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  time_range text NOT NULL,
  metrics jsonb DEFAULT '{}'::jsonb,
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(client_id, time_range)
);

ALTER TABLE public.voice_chat_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage voice chat analytics for their clients"
ON public.voice_chat_analytics
FOR ALL
TO authenticated
USING (client_id IN (
  SELECT clients.id FROM clients
  WHERE clients.agency_id IN (
    SELECT profiles.agency_id FROM profiles
    WHERE profiles.id = auth.uid()
  )
));

-- Add missing columns to prompts table
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS slot_id text;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS description text;
