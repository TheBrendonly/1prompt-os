
-- Table to store raw inbound webhook requests for mapping reference
CREATE TABLE public.workflow_webhook_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  raw_request jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workflow_webhook_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view webhook requests for their workflows"
  ON public.workflow_webhook_requests
  FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT c.id FROM public.clients c
      JOIN public.profiles p ON p.agency_id = c.agency_id
      WHERE p.id = auth.uid()
    )
  );

-- Column on workflows to store the saved mapping reference (raw JSON from a selected request)
ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS webhook_mapping_reference jsonb;

-- Index for fast lookups
CREATE INDEX idx_webhook_requests_workflow ON public.workflow_webhook_requests(workflow_id, received_at DESC);
