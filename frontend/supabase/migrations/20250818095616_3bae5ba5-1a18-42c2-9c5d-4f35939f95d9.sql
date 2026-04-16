-- Add NOT NULL constraint and default value to scheduled_for column
-- First, backfill any potential NULL values (though none should exist based on logs)
UPDATE public.leads 
SET scheduled_for = created_at 
WHERE scheduled_for IS NULL;

-- Add NOT NULL constraint with default
ALTER TABLE public.leads 
ALTER COLUMN scheduled_for SET DEFAULT now(),
ALTER COLUMN scheduled_for SET NOT NULL;

-- Create performance index for campaign processing queries
CREATE INDEX IF NOT EXISTS idx_leads_campaign_status_scheduled 
ON public.leads(campaign_id, status, scheduled_for) 
WHERE status IN ('pending', 'processing');

-- Add index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_leads_scheduled_for 
ON public.leads(scheduled_for) 
WHERE status = 'pending';