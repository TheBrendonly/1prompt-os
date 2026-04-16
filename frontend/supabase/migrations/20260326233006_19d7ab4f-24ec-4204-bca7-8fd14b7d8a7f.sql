
-- Revert: re-add the removed columns
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS persona text;

-- Revert: remove the added columns
ALTER TABLE public.prompts DROP COLUMN IF EXISTS model;
ALTER TABLE public.prompts DROP COLUMN IF EXISTS response_delay_seconds;
