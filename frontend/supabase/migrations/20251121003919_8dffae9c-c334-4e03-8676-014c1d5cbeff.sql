-- Add update_pipeline_webhook_url column to clients table
ALTER TABLE public.clients
ADD COLUMN update_pipeline_webhook_url TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.clients.update_pipeline_webhook_url IS 'Webhook URL for pipeline update notifications';