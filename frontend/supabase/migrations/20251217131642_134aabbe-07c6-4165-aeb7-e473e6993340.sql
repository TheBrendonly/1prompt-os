-- Add unique constraint for webhook_analytics to enable proper upsert persistence
ALTER TABLE public.webhook_analytics
ADD CONSTRAINT webhook_analytics_client_time_unique 
UNIQUE (client_id, time_range);