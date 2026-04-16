
CREATE TABLE public.unipile_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  unipile_account_id text NOT NULL,
  provider text NOT NULL DEFAULT 'INSTAGRAM',
  display_name text,
  status text NOT NULL DEFAULT 'connected',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, unipile_account_id)
);

ALTER TABLE public.unipile_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage unipile accounts for their clients"
ON public.unipile_accounts
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

CREATE TRIGGER update_unipile_accounts_updated_at
  BEFORE UPDATE ON public.unipile_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
