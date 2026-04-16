
CREATE TABLE public.dismissed_error_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  lead_id text NOT NULL,
  error_log_id uuid NOT NULL,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, lead_id, error_log_id)
);

ALTER TABLE public.dismissed_error_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage dismissed alerts for their clients"
  ON public.dismissed_error_alerts
  FOR ALL
  TO authenticated
  USING (client_id IN (
    SELECT c.id FROM clients c
    WHERE c.agency_id IN (
      SELECT p.agency_id FROM profiles p WHERE p.id = auth.uid()
    )
  ))
  WITH CHECK (client_id IN (
    SELECT c.id FROM clients c
    WHERE c.agency_id IN (
      SELECT p.agency_id FROM profiles p WHERE p.id = auth.uid()
    )
  ));
