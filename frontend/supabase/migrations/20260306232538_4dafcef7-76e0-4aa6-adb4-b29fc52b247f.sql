
CREATE TABLE public.dashboard_widgets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  analytics_type text NOT NULL DEFAULT 'text',
  widget_type text NOT NULL DEFAULT 'doughnut',
  title text NOT NULL,
  width text NOT NULL DEFAULT 'half',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage dashboard widgets for their clients"
ON public.dashboard_widgets
FOR ALL
TO authenticated
USING (
  client_id IN (
    SELECT clients.id FROM clients
    WHERE clients.agency_id IN (
      SELECT profiles.agency_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  )
)
WITH CHECK (
  client_id IN (
    SELECT clients.id FROM clients
    WHERE clients.agency_id IN (
      SELECT profiles.agency_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  )
);
