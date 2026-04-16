ALTER TABLE message_queue ADD COLUMN IF NOT EXISTS channel text;
ALTER TABLE dm_executions ADD COLUMN IF NOT EXISTS channel text;