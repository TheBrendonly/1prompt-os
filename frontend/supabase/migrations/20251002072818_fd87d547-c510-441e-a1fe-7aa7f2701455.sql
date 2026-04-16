-- Add separate webhook URL field for AI chat analytics
ALTER TABLE public.clients
ADD COLUMN ai_chat_webhook_url TEXT;

COMMENT ON COLUMN public.clients.ai_chat_webhook_url IS 'Webhook URL for AI chat analytics operations, independent from dashboard analytics webhook';