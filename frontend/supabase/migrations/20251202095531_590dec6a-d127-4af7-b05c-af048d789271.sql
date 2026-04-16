-- Add column to track setup guide step completion for all phases
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS setup_guide_completed_steps jsonb DEFAULT '[]'::jsonb;