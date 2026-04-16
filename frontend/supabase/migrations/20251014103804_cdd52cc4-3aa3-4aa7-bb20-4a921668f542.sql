-- Update default values for all system webhooks to ensure they persist
ALTER TABLE public.clients
ALTER COLUMN api_webhook_url SET DEFAULT 'https://n8n-1prompt.99players.com/webhook/09ac27d8-7485-4641-89f5-731fcece025d',
ALTER COLUMN prompt_webhook_url SET DEFAULT 'https://n8n-1prompt.99players.com/webhook/aa1f6488-ec31-4a9d-b311-9132775e530a',
ALTER COLUMN analytics_webhook_url SET DEFAULT 'https://n8n-1prompt.99players.com/webhook/a491a-e19-4c16-960a-95bd84fy47f0f',
ALTER COLUMN ai_chat_webhook_url SET DEFAULT 'https://n8n-1prompt.99players.com/webhook/bcd89376-0b70-44cd-9948-0378acc19ec8',
ALTER COLUMN chat_analytics_webhook_url SET DEFAULT 'https://n8n-1prompt.99players.com/webhook/b7c36233-4-405e-aca4-aa202a542f';

-- Update existing records to have the correct webhook URLs if they're null or empty
UPDATE public.clients
SET 
  api_webhook_url = COALESCE(NULLIF(api_webhook_url, ''), 'https://n8n-1prompt.99players.com/webhook/09ac27d8-7485-4641-89f5-731fcece025d'),
  prompt_webhook_url = COALESCE(NULLIF(prompt_webhook_url, ''), 'https://n8n-1prompt.99players.com/webhook/aa1f6488-ec31-4a9d-b311-9132775e530a'),
  analytics_webhook_url = COALESCE(NULLIF(analytics_webhook_url, ''), 'https://n8n-1prompt.99players.com/webhook/a491a-e19-4c16-960a-95bd84fy47f0f'),
  ai_chat_webhook_url = COALESCE(NULLIF(ai_chat_webhook_url, ''), 'https://n8n-1prompt.99players.com/webhook/bcd89376-0b70-44cd-9948-0378acc19ec8'),
  chat_analytics_webhook_url = COALESCE(NULLIF(chat_analytics_webhook_url, ''), 'https://n8n-1prompt.99players.com/webhook/b7c36233-4-405e-aca4-aa202a542f');

-- Add comments for clarity
COMMENT ON COLUMN public.clients.api_webhook_url IS 'System webhook for API and custom fields updates';
COMMENT ON COLUMN public.clients.prompt_webhook_url IS 'System webhook for prompt automation';
COMMENT ON COLUMN public.clients.analytics_webhook_url IS 'System webhook for dashboard analytics';
COMMENT ON COLUMN public.clients.ai_chat_webhook_url IS 'System webhook for AI prompt generation';
COMMENT ON COLUMN public.clients.chat_analytics_webhook_url IS 'System webhook for chat analytics events';