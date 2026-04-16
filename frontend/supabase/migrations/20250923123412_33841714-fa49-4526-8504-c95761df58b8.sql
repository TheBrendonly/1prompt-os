-- Add analytics_webhook_url column to clients table
ALTER TABLE public.clients ADD COLUMN analytics_webhook_url TEXT;

-- Add constraint to validate analytics webhook URLs
ALTER TABLE public.clients ADD CONSTRAINT valid_analytics_webhook_url 
CHECK (analytics_webhook_url IS NULL OR validate_webhook_url_enhanced(analytics_webhook_url));