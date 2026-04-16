-- Create webinar_setup table to store webinar configuration per client
CREATE TABLE public.webinar_setup (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    webinar_url TEXT,
    skool_webhook TEXT,
    beehiive_webhook TEXT,
    webinar_date TIMESTAMP WITH TIME ZONE,
    date_format_1 TEXT,
    date_format_2 TEXT,
    date_format_3 TEXT,
    date_format_4 TEXT,
    date_format_5 TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(client_id)
);

-- Enable RLS
ALTER TABLE public.webinar_setup ENABLE ROW LEVEL SECURITY;

-- Create policies for agency users
CREATE POLICY "Users can view webinar setup for their agency clients"
ON public.webinar_setup FOR SELECT
USING (EXISTS (
    SELECT 1 FROM clients
    JOIN profiles ON profiles.agency_id = clients.agency_id
    WHERE profiles.id = auth.uid() AND clients.id = webinar_setup.client_id
));

CREATE POLICY "Users can create webinar setup for their agency clients"
ON public.webinar_setup FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM clients
    JOIN profiles ON profiles.agency_id = clients.agency_id
    WHERE profiles.id = auth.uid() AND clients.id = webinar_setup.client_id
));

CREATE POLICY "Users can update webinar setup for their agency clients"
ON public.webinar_setup FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM clients
    JOIN profiles ON profiles.agency_id = clients.agency_id
    WHERE profiles.id = auth.uid() AND clients.id = webinar_setup.client_id
));

CREATE POLICY "Users can delete webinar setup for their agency clients"
ON public.webinar_setup FOR DELETE
USING (EXISTS (
    SELECT 1 FROM clients
    JOIN profiles ON profiles.agency_id = clients.agency_id
    WHERE profiles.id = auth.uid() AND clients.id = webinar_setup.client_id
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_webinar_setup_updated_at
BEFORE UPDATE ON public.webinar_setup
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();