-- Fix the lock_exact_batch function to handle all due leads properly
-- Remove the restrictive 1-minute window that was preventing proper batch processing
CREATE OR REPLACE FUNCTION public.lock_exact_batch(p_campaign_id uuid, p_batch_size integer DEFAULT 10)
 RETURNS TABLE(id uuid, campaign_id uuid, lead_data jsonb, status text, scheduled_for timestamp with time zone, processed_at timestamp with time zone, error_message text, created_at timestamp with time zone, lead_fingerprint text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  batch_scheduled_time timestamp with time zone;
  curr_time timestamp with time zone;
BEGIN
  curr_time := now();
  
  -- Find the earliest scheduled batch time that is due for processing
  -- This ensures we process batches in correct chronological order
  SELECT MIN(l.scheduled_for) INTO batch_scheduled_time
  FROM leads l
  WHERE l.campaign_id = p_campaign_id
    AND l.status = 'pending'
    AND l.scheduled_for <= curr_time; -- Process all due batches, not just those within 1 minute
  
  -- If no batch is due, return empty
  IF batch_scheduled_time IS NULL THEN
    RETURN;
  END IF;
  
  -- Lock and return leads in creation order to maintain sequence
  RETURN QUERY
  UPDATE leads 
  SET status = 'locked_for_processing'
  WHERE leads.id IN (
    SELECT l.id
    FROM leads l
    WHERE l.campaign_id = p_campaign_id
      AND l.status = 'pending'
      AND l.scheduled_for = batch_scheduled_time
    ORDER BY l.created_at ASC
    LIMIT p_batch_size
  )
  RETURNING 
    leads.id,
    leads.campaign_id,
    leads.lead_data,
    leads.status,
    leads.scheduled_for,
    leads.processed_at,
    leads.error_message,
    leads.created_at,
    leads.lead_fingerprint;
END;
$function$;