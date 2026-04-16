ALTER TABLE agent_settings ADD COLUMN IF NOT EXISTS followup_cancellation_instructions TEXT;

ALTER TABLE followup_timers ADD COLUMN IF NOT EXISTS decision TEXT;
ALTER TABLE followup_timers ADD COLUMN IF NOT EXISTS decision_reason TEXT;
ALTER TABLE followup_timers ADD COLUMN IF NOT EXISTS raw_exchange JSONB;