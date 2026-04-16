-- Create analytics refresh log table for monitoring
CREATE TABLE IF NOT EXISTS public.analytics_refresh_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  trigger_type TEXT NOT NULL, -- 'cron', 'manual', 'auto'
  clients_processed INTEGER DEFAULT 0,
  successful_operations INTEGER DEFAULT 0,
  failed_operations INTEGER DEFAULT 0,
  execution_duration_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_refresh_log ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics refresh log
CREATE POLICY "Users can view refresh logs" 
ON public.analytics_refresh_log 
FOR SELECT 
USING (true);

CREATE POLICY "System can insert refresh logs" 
ON public.analytics_refresh_log 
FOR INSERT 
WITH CHECK (true);

-- Create function to get next analytics refresh time
CREATE OR REPLACE FUNCTION public.get_next_analytics_refresh_time()
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    CASE 
      -- If current time is before 12:00 PM today, next refresh is at 12:00 PM today
      WHEN EXTRACT(HOUR FROM now()) < 12 THEN 
        date_trunc('day', now()) + interval '12 hours'
      -- Otherwise, next refresh is at 12:00 AM tomorrow
      ELSE 
        date_trunc('day', now()) + interval '1 day'
    END;
$$;