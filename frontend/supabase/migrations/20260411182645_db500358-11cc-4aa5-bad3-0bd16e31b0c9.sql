-- Create call_history table for storing Retell post-call analysis data
CREATE TABLE IF NOT EXISTS public.call_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  contact_id TEXT,
  ghl_account_id TEXT,
  call_id TEXT NOT NULL,
  agent_id TEXT,
  from_number TEXT,
  to_number TEXT,
  call_type TEXT,
  direction TEXT,
  call_status TEXT,
  disconnect_reason TEXT,
  start_timestamp TIMESTAMPTZ,
  end_timestamp TIMESTAMPTZ,
  duration_ms INTEGER,
  transcript TEXT,
  transcript_object JSONB,
  recording_url TEXT,
  public_log_url TEXT,
  call_summary TEXT,
  user_sentiment TEXT,
  call_successful BOOLEAN,
  custom_analysis_data JSONB,
  raw_payload JSONB,
  cost NUMERIC,
  latency_ms JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT call_history_call_id_unique UNIQUE (call_id)
);

-- Indexes for common queries
CREATE INDEX idx_call_history_client_id ON public.call_history(client_id);
CREATE INDEX idx_call_history_ghl_account_id ON public.call_history(ghl_account_id);
CREATE INDEX idx_call_history_contact_id ON public.call_history(contact_id);
CREATE INDEX idx_call_history_created_at ON public.call_history(created_at DESC);
CREATE INDEX idx_call_history_call_status ON public.call_history(call_status);

-- Enable RLS
ALTER TABLE public.call_history ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read call_history for their clients
CREATE POLICY "Users can view call history for their clients"
  ON public.call_history
  FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT c.id FROM public.clients c
      WHERE c.agency_id = (
        SELECT p.agency_id FROM public.profiles p WHERE p.id = auth.uid()
      )
    )
  );

-- Service role inserts (webhook) — no policy needed, service role bypasses RLS

-- Auto-update updated_at
CREATE TRIGGER update_call_history_updated_at
  BEFORE UPDATE ON public.call_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create retell_agent_mapping table for fallback client resolution
CREATE TABLE IF NOT EXISTS public.retell_agent_mapping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  ghl_account_id TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  agent_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT retell_agent_mapping_agent_id_unique UNIQUE (agent_id)
);

CREATE INDEX idx_retell_agent_mapping_agent_id ON public.retell_agent_mapping(agent_id);
CREATE INDEX idx_retell_agent_mapping_ghl_account_id ON public.retell_agent_mapping(ghl_account_id);

ALTER TABLE public.retell_agent_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view agent mappings for their clients"
  ON public.retell_agent_mapping
  FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT c.id FROM public.clients c
      WHERE c.agency_id = (
        SELECT p.agency_id FROM public.profiles p WHERE p.id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage agent mappings for their clients"
  ON public.retell_agent_mapping
  FOR ALL
  TO authenticated
  USING (
    client_id IN (
      SELECT c.id FROM public.clients c
      WHERE c.agency_id = (
        SELECT p.agency_id FROM public.profiles p WHERE p.id = auth.uid()
      )
    )
  );

CREATE TRIGGER update_retell_agent_mapping_updated_at
  BEFORE UPDATE ON public.retell_agent_mapping
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();