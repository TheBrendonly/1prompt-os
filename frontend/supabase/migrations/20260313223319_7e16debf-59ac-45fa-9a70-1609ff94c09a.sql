CREATE TABLE public.supabase_usage_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  cached_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_refreshed timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(client_id)
);

ALTER TABLE public.supabase_usage_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage supabase usage cache for their clients"
  ON public.supabase_usage_cache
  FOR ALL
  TO authenticated
  USING (client_id IN (
    SELECT clients.id FROM clients
    WHERE clients.agency_id IN (
      SELECT profiles.agency_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  ))
  WITH CHECK (client_id IN (
    SELECT clients.id FROM clients
    WHERE clients.agency_id IN (
      SELECT profiles.agency_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  ));