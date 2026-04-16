-- Add save_reply_webhook_url column to clients table
ALTER TABLE public.clients 
ADD COLUMN save_reply_webhook_url text;