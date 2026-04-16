-- Fix the lock_next_batch function to ensure proper sequential ordering
CREATE OR REPLACE FUNCTION public.lock_next_batch(p_campaign_id uuid, p_batch_size integer DEFAULT 10)
RETURNS TABLE(id uuid, campaign_id uuid, lead_data jsonb, status text, scheduled_for timestamp with time zone, processed_at timestamp with time zone, error_message text, created_at timestamp with time zone, lead_fingerprint text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  batch_scheduled_time timestamp with time zone;
  lead_ids uuid[];
BEGIN
  -- Find the earliest scheduled batch time that is due for processing
  SELECT MIN(l.scheduled_for) INTO batch_scheduled_time
  FROM leads l
  WHERE l.campaign_id = p_campaign_id
    AND l.status = 'pending'
    AND l.scheduled_for <= now();
  
  -- If no batch is due, return empty
  IF batch_scheduled_time IS NULL THEN
    RETURN;
  END IF;
  
  -- CRITICAL: Order by created_at ASC to ensure sequential processing
  -- This maintains the original order leads were inserted
  SELECT array_agg(l.id ORDER BY l.created_at ASC) INTO lead_ids
  FROM leads l
  WHERE l.campaign_id = p_campaign_id
    AND l.status = 'pending'
    AND l.scheduled_for = batch_scheduled_time
  LIMIT p_batch_size;
  
  -- Then atomically lock and return those specific leads in the same order
  RETURN QUERY
  UPDATE leads 
  SET status = 'locked_for_processing'
  WHERE leads.id = ANY(lead_ids)
  RETURNING 
    leads.id,
    leads.campaign_id,
    leads.lead_data,
    leads.status,
    leads.scheduled_for,
    leads.processed_at,
    leads.error_message,
    leads.created_at,
    leads.lead_fingerprint
  -- IMPORTANT: Return results in creation order to maintain sequence
  ORDER BY leads.created_at ASC;
END;
$function$;