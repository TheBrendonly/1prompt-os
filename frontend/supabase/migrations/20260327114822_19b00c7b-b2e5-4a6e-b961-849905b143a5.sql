CREATE TABLE public.simulation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  report_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (simulation_id)
);

ALTER TABLE public.simulation_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage simulation reports for their clients"
ON public.simulation_reports
FOR ALL
TO authenticated
USING (client_id IN (
  SELECT clients.id FROM clients
  WHERE clients.agency_id IN (
    SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid()
  )
))
WITH CHECK (client_id IN (
  SELECT clients.id FROM clients
  WHERE clients.agency_id IN (
    SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid()
  )
));