-- Create database function for atomic lead locking
CREATE OR REPLACE FUNCTION get_and_lock_pending_leads(
  p_campaign_id UUID,
  p_batch_size INTEGER DEFAULT 10
) RETURNS SETOF leads AS $$
BEGIN
  RETURN QUERY
  UPDATE leads 
  SET status = 'locked_for_processing'
  WHERE id IN (
    SELECT l.id 
    FROM leads l
    WHERE l.campaign_id = p_campaign_id
      AND l.status = 'pending'
      AND l.scheduled_for <= NOW()
    ORDER BY l.scheduled_for
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$ LANGUAGE plpgsql;