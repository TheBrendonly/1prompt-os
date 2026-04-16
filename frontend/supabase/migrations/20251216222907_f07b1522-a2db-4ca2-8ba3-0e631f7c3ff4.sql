-- Create a table to store webinar analytics reports
CREATE TABLE public.webinar_analytics_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  webinar_topic TEXT NOT NULL,
  webinar_id TEXT,
  webinar_start_time TEXT,
  webinar_duration_minutes INTEGER,
  total_attendees INTEGER NOT NULL DEFAULT 0,
  attended_count INTEGER NOT NULL DEFAULT 0,
  attendance_rate INTEGER NOT NULL DEFAULT 0,
  avg_time_minutes INTEGER NOT NULL DEFAULT 0,
  unique_countries INTEGER NOT NULL DEFAULT 0,
  guest_count INTEGER NOT NULL DEFAULT 0,
  attendees_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  report_generated_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webinar_analytics_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view webinar reports for their agency clients"
ON public.webinar_analytics_reports
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM clients
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = webinar_analytics_reports.client_id
));

CREATE POLICY "Users can create webinar reports for their agency clients"
ON public.webinar_analytics_reports
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM clients
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = webinar_analytics_reports.client_id
));

CREATE POLICY "Users can update webinar reports for their agency clients"
ON public.webinar_analytics_reports
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM clients
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = webinar_analytics_reports.client_id
));

CREATE POLICY "Users can delete webinar reports for their agency clients"
ON public.webinar_analytics_reports
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM clients
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = webinar_analytics_reports.client_id
));

-- Create updated_at trigger
CREATE TRIGGER update_webinar_analytics_reports_updated_at
BEFORE UPDATE ON public.webinar_analytics_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();