-- Create a new function that only locks batches at their exact scheduled time
-- This ensures timer and execution are synchronized
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
  
  -- Find the earliest scheduled batch time that is exactly due (within 1 minute window)
  -- This ensures we only process batches when their timer has actually expired
  SELECT MIN(l.scheduled_for) INTO batch_scheduled_time
  FROM leads l
  WHERE l.campaign_id = p_campaign_id
    AND l.status = 'pending'
    AND l.scheduled_for <= curr_time
    AND l.scheduled_for >= curr_time - interval '1 minute'; -- Only process if scheduled within last minute
  
  -- If no batch is exactly due, return empty
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