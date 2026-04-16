
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ DEFAULT NULL;

CREATE OR REPLACE FUNCTION update_lead_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE leads
  SET last_message_at = NEW.started_at
  WHERE lead_id = NEW.ghl_contact_id
    AND client_id = (
      SELECT id FROM clients WHERE ghl_location_id = NEW.ghl_account_id LIMIT 1
    )
    AND (last_message_at IS NULL OR NEW.started_at > last_message_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_lead_last_message_at ON dm_executions;
CREATE TRIGGER trg_update_lead_last_message_at
AFTER INSERT ON dm_executions
FOR EACH ROW EXECUTE FUNCTION update_lead_last_message_at();
