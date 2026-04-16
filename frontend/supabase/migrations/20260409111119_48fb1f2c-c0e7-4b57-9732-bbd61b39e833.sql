
ALTER TABLE agent_settings ADD COLUMN IF NOT EXISTS followup_1_delay_seconds INTEGER DEFAULT 0;
ALTER TABLE agent_settings ADD COLUMN IF NOT EXISTS followup_2_delay_seconds INTEGER DEFAULT 0;
ALTER TABLE agent_settings ADD COLUMN IF NOT EXISTS followup_3_delay_seconds INTEGER DEFAULT 0;

-- Backfill from old shared delay
UPDATE agent_settings SET
  followup_1_delay_seconds = COALESCE(followup_delay_seconds, 0),
  followup_2_delay_seconds = COALESCE(followup_delay_seconds, 0),
  followup_3_delay_seconds = COALESCE(followup_delay_seconds, 0);
