-- Improve get_and_lock_pending_leads to only process due leads and add performance index
DROP FUNCTION IF EXISTS public.get_and_lock_pending_leads(UUID, INTEGER);

CREATE OR REPLACE FUNCTION public.get_and_lock_pending_leads(p_campaign_id UUID, p_batch_size INTEGER)
RETURNS TABLE(
  id UUID,
  campaign_id UUID,
  lead_data JSONB,
  status TEXT,
  scheduled_for TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Atomically select and update only due leads to prevent race conditions
  RETURN QUERY
  UPDATE leads 
  SET status = 'locked_for_processing'
  WHERE leads.id IN (
    SELECT leads.id
    FROM leads
    WHERE leads.campaign_id = p_campaign_id
      AND leads.status = 'pending'
      AND leads.scheduled_for <= now()  -- Only process due leads
    ORDER BY leads.scheduled_for ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED  -- Skip already locked rows
  )
  RETURNING 
    leads.id,
    leads.campaign_id,
    leads.lead_data,
    leads.status,
    leads.scheduled_for,
    leads.processed_at,
    leads.error_message,
    leads.created_at;
END;
$$;

-- Add performance index for efficient lead queries
CREATE INDEX IF NOT EXISTS idx_leads_campaign_status_scheduled 
ON leads(campaign_id, status, scheduled_for) 
WHERE status = 'pending';