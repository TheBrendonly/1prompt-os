CREATE TABLE prompt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  slot_id text NOT NULL,
  version_number integer NOT NULL,
  prompt_content text NOT NULL,
  label text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, slot_id, version_number)
);

ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage prompt versions for their clients"
ON prompt_versions FOR ALL TO authenticated
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