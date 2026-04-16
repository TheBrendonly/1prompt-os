-- Add followup_instructions to agent_settings (followup_delay_seconds already exists)
ALTER TABLE agent_settings
  ADD COLUMN IF NOT EXISTS followup_instructions TEXT DEFAULT NULL;

-- Table to track pending/fired/cancelled follow-up timers
CREATE TABLE IF NOT EXISTS followup_timers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  ghl_contact_id TEXT NOT NULL,
  ghl_account_id TEXT NOT NULL,
  setter_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  fires_at TIMESTAMPTZ NOT NULL,
  followup_message TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_followup_timers_contact 
  ON followup_timers(ghl_contact_id, ghl_account_id, status);

-- Enable RLS
ALTER TABLE followup_timers ENABLE ROW LEVEL SECURITY;

-- RLS policies: service role (edge functions) can do everything via service key
-- Authenticated users can access timers for their clients
CREATE POLICY "Users can view followup timers for their clients"
  ON followup_timers FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Users can insert followup timers for their clients"
  ON followup_timers FOR INSERT TO authenticated
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Users can update followup timers for their clients"
  ON followup_timers FOR UPDATE TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Users can delete followup timers for their clients"
  ON followup_timers FOR DELETE TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid())));