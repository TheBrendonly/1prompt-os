-- Drip position tracker: one row per workflow+node+campaign
CREATE TABLE IF NOT EXISTS engagement_drip_positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  workflow_id UUID NOT NULL,
  node_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  batch_size INTEGER NOT NULL,
  interval_seconds INTEGER NOT NULL,
  next_position INTEGER DEFAULT 0 NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(workflow_id, node_id, campaign_id)
);

-- Enable RLS
ALTER TABLE engagement_drip_positions ENABLE ROW LEVEL SECURITY;

-- RLS: agency users can manage drip positions for their clients
CREATE POLICY "Users can manage drip positions for their clients"
ON engagement_drip_positions
FOR ALL
TO authenticated
USING (
  client_id IN (
    SELECT c.id FROM clients c
    JOIN profiles p ON p.agency_id = c.agency_id
    WHERE p.id = auth.uid()
  )
);

-- Atomic function: claims the next position in a drip queue.
CREATE OR REPLACE FUNCTION claim_drip_position(
  p_client_id UUID,
  p_workflow_id UUID,
  p_node_id TEXT,
  p_campaign_id TEXT,
  p_batch_size INTEGER,
  p_interval_seconds INTEGER
) RETURNS JSON AS $$
DECLARE
  v_position INTEGER;
  v_started_at TIMESTAMPTZ;
BEGIN
  INSERT INTO engagement_drip_positions
    (client_id, workflow_id, node_id, campaign_id, batch_size, interval_seconds, next_position, started_at)
  VALUES
    (p_client_id, p_workflow_id, p_node_id, p_campaign_id, p_batch_size, p_interval_seconds, 1, now())
  ON CONFLICT (workflow_id, node_id, campaign_id)
  DO UPDATE SET next_position = engagement_drip_positions.next_position + 1
  RETURNING engagement_drip_positions.next_position - 1, engagement_drip_positions.started_at
  INTO v_position, v_started_at;

  RETURN json_build_object('position', v_position, 'started_at', v_started_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add campaign_id to engagement_executions
ALTER TABLE engagement_executions ADD COLUMN IF NOT EXISTS campaign_id TEXT;