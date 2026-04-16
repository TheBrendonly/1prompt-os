-- Create custom metrics table for user-defined analytics
CREATE TABLE public.custom_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  prompt TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for custom metrics
CREATE POLICY "Users can create custom metrics for their agency clients" 
ON public.custom_metrics 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clients
    JOIN profiles ON profiles.agency_id = clients.agency_id
    WHERE profiles.id = auth.uid() AND clients.id = custom_metrics.client_id
  )
);

CREATE POLICY "Users can view custom metrics for their agency clients" 
ON public.custom_metrics 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM clients
    JOIN profiles ON profiles.agency_id = clients.agency_id
    WHERE profiles.id = auth.uid() AND clients.id = custom_metrics.client_id
  )
);

CREATE POLICY "Users can update custom metrics for their agency clients" 
ON public.custom_metrics 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM clients
    JOIN profiles ON profiles.agency_id = clients.agency_id
    WHERE profiles.id = auth.uid() AND clients.id = custom_metrics.client_id
  )
);

CREATE POLICY "Users can delete custom metrics for their agency clients" 
ON public.custom_metrics 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM clients
    JOIN profiles ON profiles.agency_id = clients.agency_id
    WHERE profiles.id = auth.uid() AND clients.id = custom_metrics.client_id
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_custom_metrics_updated_at
BEFORE UPDATE ON public.custom_metrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();