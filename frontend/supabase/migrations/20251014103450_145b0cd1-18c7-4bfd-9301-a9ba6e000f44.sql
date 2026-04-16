-- Add chat_analytics_webhook_url column to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS chat_analytics_webhook_url TEXT DEFAULT 'https://n8n-1prompt.99players.com/webhook/b7c36233-4-405e-aca4-aa202a542f';

-- Add comment for clarity
COMMENT ON COLUMN public.clients.chat_analytics_webhook_url IS 'Webhook URL for chat analytics events';

-- Update existing records to have the default value
UPDATE public.clients
SET chat_analytics_webhook_url = 'https://n8n-1prompt.99players.com/webhook/b7c36233-4-405e-aca4-aa202a542f'
WHERE chat_analytics_webhook_url IS NULL;