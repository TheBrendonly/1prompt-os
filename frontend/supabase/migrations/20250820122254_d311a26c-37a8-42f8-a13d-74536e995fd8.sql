-- Drop existing function first and recreate
DROP FUNCTION IF EXISTS get_and_lock_pending_leads(uuid, integer);

-- Create database function for atomic lead locking
CREATE OR REPLACE FUNCTION get_and_lock_pending_leads(
  p_campaign_id UUID,
  p_batch_size INTEGER DEFAULT 10
) RETURNS SETOF leads AS $$
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
$$ LANGUAGE plpgsql;