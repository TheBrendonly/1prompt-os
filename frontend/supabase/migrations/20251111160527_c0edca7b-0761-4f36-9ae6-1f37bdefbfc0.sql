-- Add phone_call_webhook_url column to demo_pages table
ALTER TABLE public.demo_pages 
ADD COLUMN IF NOT EXISTS phone_call_webhook_url text;