
-- Agent settings table for per-agent configuration
CREATE TABLE public.agent_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  slot_id text NOT NULL,
  model text DEFAULT 'anthropic/claude-sonnet-4.5',
  response_delay_seconds integer DEFAULT 0,
  followup_delay_seconds integer DEFAULT 0,
  file_processing_enabled boolean DEFAULT true,
  human_transfer_enabled boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(client_id, slot_id)
);

ALTER TABLE public.agent_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage agent settings for their clients"
ON public.agent_settings
FOR ALL
TO authenticated
USING (client_id IN (
  SELECT clients.id FROM clients
  WHERE clients.agency_id IN (
    SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid()
  )
));

-- Error logs table for OpenRouter and system errors
CREATE TABLE public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  error_type text NOT NULL DEFAULT 'system',
  error_message text NOT NULL,
  error_details jsonb DEFAULT '{}'::jsonb,
  source text DEFAULT 'openrouter',
  resolved boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage error logs for their clients"
ON public.error_logs
FOR ALL
TO authenticated
USING (client_id IN (
  SELECT clients.id FROM clients
  WHERE clients.agency_id IN (
    SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid()
  )
));

-- Public insert policy for error_logs so n8n/webhooks can insert errors
CREATE POLICY "Anyone can insert error logs"
ON public.error_logs
FOR INSERT
TO anon
WITH CHECK (true);
