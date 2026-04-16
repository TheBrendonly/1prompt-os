-- Add campaign_webhook_url column to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS campaign_webhook_url TEXT;