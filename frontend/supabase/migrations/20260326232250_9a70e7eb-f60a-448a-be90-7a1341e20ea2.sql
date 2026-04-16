
-- Add model and response_delay_seconds columns to prompts table
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS model text DEFAULT NULL;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS response_delay_seconds integer DEFAULT 0;

-- Remove columns that are no longer needed
ALTER TABLE public.prompts DROP COLUMN IF EXISTS name;
ALTER TABLE public.prompts DROP COLUMN IF EXISTS description;
ALTER TABLE public.prompts DROP COLUMN IF EXISTS persona;
