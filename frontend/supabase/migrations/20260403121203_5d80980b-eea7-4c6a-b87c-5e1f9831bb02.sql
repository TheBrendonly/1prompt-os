
CREATE TABLE public.client_custom_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, field_name)
);

ALTER TABLE public.client_custom_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage custom fields for their clients"
  ON public.client_custom_fields
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
