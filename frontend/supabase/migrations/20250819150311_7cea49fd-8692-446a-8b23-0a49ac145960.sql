-- Create a function to atomically get and lock pending leads for processing
CREATE OR REPLACE FUNCTION get_and_lock_pending_leads(p_campaign_id UUID, p_batch_size INTEGER)
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
AS $$
BEGIN
  -- Atomically select and update leads to prevent race conditions
  UPDATE leads 
  SET status = 'locked_for_processing'
  WHERE leads.id IN (
    SELECT leads.id
    FROM leads
    WHERE leads.campaign_id = p_campaign_id
      AND leads.status = 'pending'
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
    leads.created_at
  INTO 
    id,
    campaign_id,
    lead_data,
    status,
    scheduled_for,
    processed_at,
    error_message,
    created_at;
    
  RETURN QUERY
  SELECT * FROM leads
  WHERE leads.campaign_id = p_campaign_id
    AND leads.status = 'locked_for_processing'
  ORDER BY leads.scheduled_for ASC
  LIMIT p_batch_size;
END;
$$;