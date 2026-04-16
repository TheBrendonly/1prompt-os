-- Create webhook_analytics table for persistent webhook response storage
CREATE TABLE public.webhook_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  time_range TEXT NOT NULL,
  webhook_response JSONB,
  last_refreshed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, time_range)
);

-- Enable Row Level Security
ALTER TABLE public.webhook_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for webhook analytics
CREATE POLICY "Users can view their own webhook analytics" 
ON public.webhook_analytics 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own webhook analytics" 
ON public.webhook_analytics 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own webhook analytics" 
ON public.webhook_analytics 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own webhook analytics" 
ON public.webhook_analytics 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_webhook_analytics_updated_at
BEFORE UPDATE ON public.webhook_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();