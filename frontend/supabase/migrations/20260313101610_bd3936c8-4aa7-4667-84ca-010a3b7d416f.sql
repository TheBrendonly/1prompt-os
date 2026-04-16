
CREATE TABLE public.metric_analysis_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_id UUID REFERENCES public.custom_metrics(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  time_range TEXT NOT NULL,
  analysis_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.metric_analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage metric analysis for their clients"
ON public.metric_analysis_results
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

CREATE INDEX idx_metric_analysis_lookup ON public.metric_analysis_results(metric_id, client_id, time_range);
