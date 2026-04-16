
-- Add enable/disable flag for the sync GHL contacts workflow
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS sync_ghl_enabled boolean DEFAULT false;

-- Create execution log table for the sync GHL contacts workflow
CREATE TABLE public.sync_ghl_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  external_id text NOT NULL,
  contact_name text,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for efficient lookup
CREATE INDEX idx_sync_ghl_executions_client ON public.sync_ghl_executions(client_id, created_at DESC);

-- RLS
ALTER TABLE public.sync_ghl_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on sync_ghl_executions"
  ON public.sync_ghl_executions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read sync_ghl_executions for their clients"
  ON public.sync_ghl_executions
  FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM public.clients
    )
  );
