
CREATE TABLE public.request_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  request_type text NOT NULL DEFAULT 'webhook',
  source text NOT NULL DEFAULT '',
  endpoint_url text,
  method text DEFAULT 'POST',
  request_body jsonb DEFAULT '{}'::jsonb,
  response_body jsonb DEFAULT '{}'::jsonb,
  status_code integer,
  status text NOT NULL DEFAULT 'success',
  error_message text,
  duration_ms integer,
  tokens_used integer,
  cost numeric(10,6),
  model text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_request_logs_client_id ON public.request_logs(client_id);
CREATE INDEX idx_request_logs_created_at ON public.request_logs(created_at DESC);
CREATE INDEX idx_request_logs_request_type ON public.request_logs(request_type);
CREATE INDEX idx_request_logs_status ON public.request_logs(status);

ALTER TABLE public.request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view request logs for their clients"
  ON public.request_logs
  FOR SELECT
  TO authenticated
  USING (client_id IN (
    SELECT clients.id FROM clients
    WHERE clients.agency_id IN (
      SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid()
    )
  ));

CREATE POLICY "Service role can insert request logs"
  ON public.request_logs
  FOR INSERT
  TO authenticated, service_role
  WITH CHECK (true);

CREATE POLICY "Users can delete request logs for their clients"
  ON public.request_logs
  FOR DELETE
  TO authenticated
  USING (client_id IN (
    SELECT clients.id FROM clients
    WHERE clients.agency_id IN (
      SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid()
    )
  ));
