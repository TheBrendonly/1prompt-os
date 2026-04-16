-- Add webhook_url column to prompts table
ALTER TABLE public.prompts 
ADD COLUMN webhook_url TEXT;