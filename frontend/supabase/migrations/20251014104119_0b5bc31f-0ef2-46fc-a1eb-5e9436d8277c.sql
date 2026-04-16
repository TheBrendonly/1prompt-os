-- Update the analytics_webhook_url to the correct value
UPDATE public.clients
SET analytics_webhook_url = 'https://n8n-1prompt.99players.com/webhook/a491a-e19-4c16-960a-95bd84fy47f0f'
WHERE analytics_webhook_url IS NULL 
   OR analytics_webhook_url != 'https://n8n-1prompt.99players.com/webhook/a491a-e19-4c16-960a-95bd84fy47f0f';

-- Also update the default to ensure new records get the right value
ALTER TABLE public.clients
ALTER COLUMN analytics_webhook_url SET DEFAULT 'https://n8n-1prompt.99players.com/webhook/a491a-e19-4c16-960a-95bd84fy47f0f';