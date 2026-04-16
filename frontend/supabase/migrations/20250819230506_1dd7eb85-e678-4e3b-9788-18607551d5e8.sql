-- Add webhook URLs to clients table for Knowledge Base and Prompt Management
ALTER TABLE public.clients 
ADD COLUMN knowledge_base_add_webhook_url text,
ADD COLUMN knowledge_base_delete_webhook_url text,
ADD COLUMN prompt_webhook_url text;