CREATE TABLE public.lead_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lead notes for their clients"
  ON public.lead_notes FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can insert lead notes for their clients"
  ON public.lead_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id IN (
      SELECT id FROM public.clients WHERE agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can delete lead notes for their clients"
  ON public.lead_notes FOR DELETE
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
    )
  );