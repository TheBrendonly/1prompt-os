-- Fix the get_and_lock_pending_leads function to match the current leads table structure
CREATE OR REPLACE FUNCTION public.get_and_lock_pending_leads(p_campaign_id uuid, p_batch_size integer DEFAULT 10)
 RETURNS SETOF leads
 LANGUAGE plpgsql
AS $function$
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
    leads.created_at,
    leads.lead_fingerprint;  -- Added missing column
END;
$function$