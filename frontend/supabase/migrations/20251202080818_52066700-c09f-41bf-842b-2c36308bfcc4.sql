-- Add lead_score_webhook_url column to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS lead_score_webhook_url text;