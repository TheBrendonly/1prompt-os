-- Create atomic batch locking function to prevent race conditions
CREATE OR REPLACE FUNCTION public.lock_next_batch(p_campaign_id uuid, p_batch_size integer DEFAULT 10)
RETURNS TABLE(
  id uuid,
  campaign_id uuid,
  lead_data jsonb,
  status text,
  scheduled_for timestamp with time zone,
  processed_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone,
  lead_fingerprint text
)
LANGUAGE plpgsql
SECURITY DEFINER
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
  
  -- Atomically lock and return ALL leads scheduled for this exact batch time
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
    FOR UPDATE SKIP LOCKED
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

-- Update reschedule function to respect campaign schedule settings
CREATE OR REPLACE FUNCTION public.reschedule_campaign_leads(p_campaign_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  campaign_record RECORD;
  lead_record RECORD;
  current_schedule_time TIMESTAMP WITH TIME ZONE;
  lead_index INTEGER := 0;
  total_rescheduled INTEGER := 0;
  current_day INTEGER;
  start_hour INTEGER;
  start_minute INTEGER;
  end_hour INTEGER;
  end_minute INTEGER;
BEGIN
  -- Get campaign settings
  SELECT * INTO campaign_record
  FROM campaigns 
  WHERE id = p_campaign_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found: %', p_campaign_id;
  END IF;
  
  -- Parse start and end times
  SELECT 
    CAST(split_part(campaign_record.start_time, ':', 1) AS INTEGER),
    CAST(split_part(campaign_record.start_time, ':', 2) AS INTEGER),
    CAST(split_part(campaign_record.end_time, ':', 1) AS INTEGER),
    CAST(split_part(campaign_record.end_time, ':', 2) AS INTEGER)
  INTO start_hour, start_minute, end_hour, end_minute;
  
  -- Start from current time
  current_schedule_time := now();
  
  -- Move to next valid business time if needed
  LOOP
    -- Convert to campaign timezone for checking
    current_day := EXTRACT(DOW FROM current_schedule_time AT TIME ZONE campaign_record.timezone);
    
    -- Check if current day is in allowed days (convert Sunday from 0 to 7 for array access)
    IF current_day = 0 THEN current_day := 7; END IF;
    
    -- Check if current day is in campaign schedule
    IF current_day = ANY(campaign_record.days_of_week) THEN
      -- Check if current time is within business hours
      IF EXTRACT(HOUR FROM current_schedule_time AT TIME ZONE campaign_record.timezone) * 60 + 
         EXTRACT(MINUTE FROM current_schedule_time AT TIME ZONE campaign_record.timezone) >=
         start_hour * 60 + start_minute AND
         EXTRACT(HOUR FROM current_schedule_time AT TIME ZONE campaign_record.timezone) * 60 + 
         EXTRACT(MINUTE FROM current_schedule_time AT TIME ZONE campaign_record.timezone) <=
         end_hour * 60 + end_minute THEN
        -- We're in valid time, break the loop
        EXIT;
      ELSE
        -- Move to start of business hours today or tomorrow
        IF EXTRACT(HOUR FROM current_schedule_time AT TIME ZONE campaign_record.timezone) * 60 + 
           EXTRACT(MINUTE FROM current_schedule_time AT TIME ZONE campaign_record.timezone) >
           end_hour * 60 + end_minute THEN
          -- After hours, move to next day at start time
          current_schedule_time := (current_schedule_time AT TIME ZONE campaign_record.timezone)::date + 1 + 
                                 (start_hour || ':' || start_minute)::time;
          current_schedule_time := current_schedule_time AT TIME ZONE campaign_record.timezone;
        ELSE
          -- Before hours, move to start time today
          current_schedule_time := (current_schedule_time AT TIME ZONE campaign_record.timezone)::date + 
                                 (start_hour || ':' || start_minute)::time;
          current_schedule_time := current_schedule_time AT TIME ZONE campaign_record.timezone;
        END IF;
      END IF;
    ELSE
      -- Not a valid day, move to next day at start time
      current_schedule_time := (current_schedule_time AT TIME ZONE campaign_record.timezone)::date + 1 + 
                             (start_hour || ':' || start_minute)::time;
      current_schedule_time := current_schedule_time AT TIME ZONE campaign_record.timezone;
    END IF;
  END LOOP;
  
  -- Update all pending leads with new scheduled times
  FOR lead_record IN 
    SELECT id FROM leads 
    WHERE campaign_id = p_campaign_id 
    AND status = 'pending'
    ORDER BY created_at
  LOOP
    -- Update the lead's scheduled time
    UPDATE leads 
    SET scheduled_for = current_schedule_time
    WHERE id = lead_record.id;
    
    lead_index := lead_index + 1;
    total_rescheduled := total_rescheduled + 1;
    
    -- Calculate next schedule time
    IF lead_index % campaign_record.batch_size = 0 THEN
      -- After each batch, wait for batch interval
      current_schedule_time := current_schedule_time + 
        (campaign_record.batch_interval_minutes || ' minutes')::interval;
      
      -- Check if we've moved outside business hours or to non-business day
      -- If so, adjust to next valid time
      current_day := EXTRACT(DOW FROM current_schedule_time AT TIME ZONE campaign_record.timezone);
      IF current_day = 0 THEN current_day := 7; END IF;
      
      IF NOT (current_day = ANY(campaign_record.days_of_week)) OR
         EXTRACT(HOUR FROM current_schedule_time AT TIME ZONE campaign_record.timezone) * 60 + 
         EXTRACT(MINUTE FROM current_schedule_time AT TIME ZONE campaign_record.timezone) >
         end_hour * 60 + end_minute THEN
        -- Move to next business day at start time
        current_schedule_time := (current_schedule_time AT TIME ZONE campaign_record.timezone)::date + 1 + 
                               (start_hour || ':' || start_minute)::time;
        current_schedule_time := current_schedule_time AT TIME ZONE campaign_record.timezone;
      END IF;
    ELSE
      -- Between leads in same batch, use lead delay
      current_schedule_time := current_schedule_time + 
        (campaign_record.lead_delay_seconds || ' seconds')::interval;
    END IF;
  END LOOP;
  
  -- Log the rescheduling
  INSERT INTO execution_logs (
    campaign_id, 
    status, 
    webhook_response,
    error_details
  ) VALUES (
    p_campaign_id,
    'AUDIT_LEADS_RESCHEDULED',
    json_build_object(
      'total_rescheduled', total_rescheduled,
      'reschedule_time', now(),
      'first_scheduled', (
        SELECT MIN(scheduled_for) FROM leads 
        WHERE campaign_id = p_campaign_id AND status = 'pending'
      ),
      'timezone', campaign_record.timezone,
      'start_time', campaign_record.start_time,
      'end_time', campaign_record.end_time,
      'days_of_week', campaign_record.days_of_week
    )::text,
    format('Rescheduled %s leads respecting campaign schedule', total_rescheduled)
  );
  
  RETURN true;
END;
$function$;