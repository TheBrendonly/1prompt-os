-- Add slot_id column to prompts table to identify which static slot each prompt belongs to
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS slot_id TEXT;

-- Add unique constraint to ensure one prompt per slot per client
ALTER TABLE prompts ADD CONSTRAINT prompts_client_slot_unique UNIQUE (client_id, slot_id);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_prompts_slot_id ON prompts(slot_id);

COMMENT ON COLUMN prompts.slot_id IS 'Static slot identifier (e.g., bot-persona, text-1, text-2, voice-1, etc.)';