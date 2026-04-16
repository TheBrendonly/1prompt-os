-- Add Text Engine webhook fields to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS text_engine_webhook text,
ADD COLUMN IF NOT EXISTS text_engine_followup_webhook text;