-- Add webhook columns for caller webhooks
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS inbound_caller_webhook_url TEXT,
ADD COLUMN IF NOT EXISTS outbound_caller_webhook_1_url TEXT,
ADD COLUMN IF NOT EXISTS outbound_caller_webhook_2_url TEXT,
ADD COLUMN IF NOT EXISTS outbound_caller_webhook_3_url TEXT;