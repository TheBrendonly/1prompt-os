-- Create table for traffic wizard answers
CREATE TABLE public.traffic_wizard_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(client_id)
);

-- Enable RLS
ALTER TABLE public.traffic_wizard_answers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view traffic wizard answers for their agency clients"
ON public.traffic_wizard_answers FOR SELECT
USING (EXISTS (
  SELECT 1 FROM clients
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = traffic_wizard_answers.client_id
));

CREATE POLICY "Users can create traffic wizard answers for their agency clients"
ON public.traffic_wizard_answers FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM clients
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = traffic_wizard_answers.client_id
));

CREATE POLICY "Users can update traffic wizard answers for their agency clients"
ON public.traffic_wizard_answers FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM clients
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = traffic_wizard_answers.client_id
));

CREATE POLICY "Users can delete traffic wizard answers for their agency clients"
ON public.traffic_wizard_answers FOR DELETE
USING (EXISTS (
  SELECT 1 FROM clients
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = traffic_wizard_answers.client_id
));

-- Create trigger for updated_at
CREATE TRIGGER update_traffic_wizard_answers_updated_at
BEFORE UPDATE ON public.traffic_wizard_answers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();