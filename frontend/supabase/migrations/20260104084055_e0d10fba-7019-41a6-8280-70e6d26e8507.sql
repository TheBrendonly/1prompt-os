-- Add presentation_only_mode column to clients table
ALTER TABLE public.clients 
ADD COLUMN presentation_only_mode boolean DEFAULT false;

-- Set the existing Brendan client to presentation-only mode
UPDATE public.clients 
SET presentation_only_mode = true 
WHERE id = 'c06ef67e-891c-4668-9409-c42b6d0a9fcb';

-- Add a comment to explain the column
COMMENT ON COLUMN public.clients.presentation_only_mode IS 'When true, this client only sees the Webinar Presentation Agent with a minimal full-page UI, no sidebar or other tools';