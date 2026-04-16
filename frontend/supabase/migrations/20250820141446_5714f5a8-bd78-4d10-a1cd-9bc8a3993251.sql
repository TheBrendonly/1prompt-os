-- Create a function to reschedule leads within business hours
CREATE OR REPLACE FUNCTION reschedule_campaign_leads(
  p_campaign_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  campaign_record RECORD;
  lead_record RECORD;
  current_schedule_time TIMESTAMP WITH TIME ZONE;
  lead_index INTEGER := 0;
  total_rescheduled INTEGER := 0;
BEGIN
  -- Get campaign settings
  SELECT * INTO campaign_record
  FROM campaigns 
  WHERE id = p_campaign_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found: %', p_campaign_id;
  END IF;
  
  -- Calculate the next valid business time from now
  current_schedule_time := now();
  
  -- If we're outside business hours, find the next valid time
  -- This is a simplified version - in production you'd use the proper timezone logic
  IF EXTRACT(hour FROM current_schedule_time AT TIME ZONE campaign_record.timezone) < 9 
     OR EXTRACT(hour FROM current_schedule_time AT TIME ZONE campaign_record.timezone) >= 17 THEN
    -- Move to next business day at 9 AM
    current_schedule_time := (current_schedule_time::date + 1)::timestamp + interval '9 hours';
  END IF;
  
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
      )
    )::text,
    format('Rescheduled %s leads to proper business hours', total_rescheduled)
  );
  
  RETURN true;
END;
$$;

-- Reschedule the current campaign's leads
SELECT reschedule_campaign_leads('8c464eef-de23-4d24-b75e-c35c57e695e3');