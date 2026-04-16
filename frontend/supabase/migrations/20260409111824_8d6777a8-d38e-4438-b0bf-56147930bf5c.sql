-- Copy existing followup_delay_seconds data into followup_1_delay_seconds where not already set
UPDATE public.agent_settings
SET followup_1_delay_seconds = COALESCE(followup_delay_seconds, 0)
WHERE followup_1_delay_seconds IS NULL OR followup_1_delay_seconds = 0;

-- Drop the old column
ALTER TABLE public.agent_settings DROP COLUMN IF EXISTS followup_delay_seconds;