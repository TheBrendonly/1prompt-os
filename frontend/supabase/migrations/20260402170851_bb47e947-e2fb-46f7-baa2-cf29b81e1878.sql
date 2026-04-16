CREATE TABLE public.setter_ai_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  slot_id TEXT NOT NULL,
  report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT setter_ai_reports_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE,
  CONSTRAINT setter_ai_reports_client_id_slot_id_key UNIQUE (client_id, slot_id)
);

ALTER TABLE public.setter_ai_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency users can manage setter AI reports for their clients"
ON public.setter_ai_reports
FOR ALL
TO authenticated
USING (
  client_id IN (
    SELECT clients.id
    FROM public.clients
    WHERE clients.agency_id IN (
      SELECT profiles.agency_id
      FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  )
)
WITH CHECK (
  client_id IN (
    SELECT clients.id
    FROM public.clients
    WHERE clients.agency_id IN (
      SELECT profiles.agency_id
      FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  )
);

CREATE POLICY "Client users can manage their own setter AI reports"
ON public.setter_ai_reports
FOR ALL
TO authenticated
USING (client_id = public.get_user_client_id(auth.uid()))
WITH CHECK (client_id = public.get_user_client_id(auth.uid()));

CREATE TRIGGER update_setter_ai_reports_updated_at
BEFORE UPDATE ON public.setter_ai_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();