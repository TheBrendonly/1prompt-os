-- Add webhook_url field to knowledge_base table
ALTER TABLE public.knowledge_base 
ADD COLUMN webhook_url TEXT;