-- Update the ai_chat_webhook_url to the correct value
UPDATE public.clients
SET ai_chat_webhook_url = 'https://n8n-1prompt.99players.com/webhook/bcd89376-0b70-44cd-9948-0378acc19ec8'
WHERE ai_chat_webhook_url IS NULL 
   OR ai_chat_webhook_url = 'https://n8n-1prompt.99players.com/webhook/b7c36233-4-405e-aca4-aa202a542f'
   OR ai_chat_webhook_url = '';

-- Also update the default to ensure new records get the right value
ALTER TABLE public.clients
ALTER COLUMN ai_chat_webhook_url SET DEFAULT 'https://n8n-1prompt.99players.com/webhook/bcd89376-0b70-44cd-9948-0378acc19ec8';