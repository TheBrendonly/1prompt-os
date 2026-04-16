
CREATE TABLE public.client_menu_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  menu_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(client_id)
);

ALTER TABLE public.client_menu_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage menu config for their clients"
ON public.client_menu_config
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

-- Allow client-role users to read their own menu config
CREATE POLICY "Client users can read their own menu config"
ON public.client_menu_config
FOR SELECT
TO authenticated
USING (
  client_id = public.get_user_client_id(auth.uid())
);
