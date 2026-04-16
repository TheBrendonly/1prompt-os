-- Fix search_path security issues for specific functions
CREATE OR REPLACE FUNCTION public.lock_next_batch(p_campaign_id uuid, p_batch_size integer DEFAULT 10)
RETURNS TABLE(id uuid, campaign_id uuid, lead_data jsonb, status text, scheduled_for timestamp with time zone, processed_at timestamp with time zone, error_message text, created_at timestamp with time zone, lead_fingerprint text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  batch_scheduled_time timestamp with time zone;
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

-- Fix other functions missing search_path
CREATE OR REPLACE FUNCTION public.get_and_lock_pending_leads(p_campaign_id uuid, p_batch_size integer DEFAULT 10)
RETURNS SETOF leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
    leads.lead_fingerprint;
END;
$function$;

CREATE OR REPLACE FUNCTION public.compute_lead_fingerprint(lead_data_param jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  email_normalized TEXT;
  phone_normalized TEXT;
  name_normalized TEXT;
  fingerprint_parts TEXT[];
BEGIN
  -- Normalize email (lowercase, trim)
  IF lead_data_param ? 'email' AND lead_data_param->>'email' IS NOT NULL THEN
    email_normalized := lower(trim(lead_data_param->>'email'));
    fingerprint_parts := array_append(fingerprint_parts, 'email:' || email_normalized);
  END IF;
  
  -- Normalize phone (digits only)
  IF lead_data_param ? 'phone' AND lead_data_param->>'phone' IS NOT NULL THEN
    phone_normalized := regexp_replace(lead_data_param->>'phone', '[^0-9]', '', 'g');
    IF length(phone_normalized) >= 10 THEN
      fingerprint_parts := array_append(fingerprint_parts, 'phone:' || phone_normalized);
    END IF;
  END IF;
  
  -- Normalize name (lowercase, trim, remove extra spaces)
  IF lead_data_param ? 'name' AND lead_data_param->>'name' IS NOT NULL THEN
    name_normalized := lower(trim(regexp_replace(lead_data_param->>'name', '\s+', ' ', 'g')));
    fingerprint_parts := array_append(fingerprint_parts, 'name:' || name_normalized);
  END IF;
  
  -- Return combined fingerprint or NULL if no identifying info
  IF array_length(fingerprint_parts, 1) > 0 THEN
    RETURN array_to_string(fingerprint_parts, '|');
  ELSE
    RETURN NULL;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_lead_fingerprint()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.lead_fingerprint := public.compute_lead_fingerprint(NEW.lead_data);
  RETURN NEW;
END;
$function$;