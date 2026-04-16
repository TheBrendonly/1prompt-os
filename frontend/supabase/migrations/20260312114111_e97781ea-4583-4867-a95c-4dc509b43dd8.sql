
CREATE TABLE public.prompt_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  slot_id text NOT NULL,
  config_key text NOT NULL,
  selected_option text,
  custom_content text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (client_id, slot_id, config_key)
);

ALTER TABLE public.prompt_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage prompt configs for their clients"
ON public.prompt_configurations
FOR ALL
TO authenticated
USING (
  client_id IN (
    SELECT clients.id FROM clients
    WHERE clients.agency_id IN (
      SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid()
    )
  )
)
WITH CHECK (
  client_id IN (
    SELECT clients.id FROM clients
    WHERE clients.agency_id IN (
      SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid()
    )
  )
);

CREATE TRIGGER update_prompt_configurations_updated_at
  BEFORE UPDATE ON public.prompt_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
