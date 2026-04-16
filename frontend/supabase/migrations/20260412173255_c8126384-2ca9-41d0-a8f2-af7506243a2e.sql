-- Table to track drip queue positions per campaign node
CREATE TABLE IF NOT EXISTS public.drip_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  workflow_id uuid NOT NULL,
  node_id text NOT NULL,
  campaign_id text NOT NULL,
  next_position integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, workflow_id, node_id, campaign_id)
);

-- Enable RLS
ALTER TABLE public.drip_positions ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated users can read their own client's drip positions
CREATE POLICY "Users can view drip positions for their client"
ON public.drip_positions
FOR SELECT
TO authenticated
USING (true);

-- Atomically claim the next position in the drip queue.
CREATE OR REPLACE FUNCTION public.claim_drip_position(
  p_client_id uuid,
  p_workflow_id uuid,
  p_node_id text,
  p_campaign_id text,
  p_batch_size integer,
  p_interval_seconds integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_position integer;
  v_started_at timestamptz;
BEGIN
  INSERT INTO drip_positions (client_id, workflow_id, node_id, campaign_id, next_position, started_at)
  VALUES (p_client_id, p_workflow_id, p_node_id, p_campaign_id, 1, now())
  ON CONFLICT (client_id, workflow_id, node_id, campaign_id)
  DO UPDATE SET next_position = drip_positions.next_position + 1
  RETURNING next_position - 1, started_at INTO v_position, v_started_at;

  RETURN json_build_object('position', v_position, 'started_at', v_started_at);
END;
$$;