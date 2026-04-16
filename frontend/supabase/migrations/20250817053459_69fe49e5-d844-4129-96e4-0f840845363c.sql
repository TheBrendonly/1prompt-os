-- First, let's add the date-fns-tz package for timezone handling
-- Enable the pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Update campaigns table structure for better scheduling
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS schedule_days jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS start_time time DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS end_time time DEFAULT '17:00:00',
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/New_York',
ADD COLUMN IF NOT EXISTS batch_size integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS interval_minutes integer DEFAULT 15,
ADD COLUMN IF NOT EXISTS processing_delay_seconds integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS last_processed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS next_batch_at timestamp with time zone;

-- Rename leads table to campaign_leads for better clarity
ALTER TABLE leads RENAME TO campaign_leads;

-- Add scheduled_for column with timezone support to campaign_leads
ALTER TABLE campaign_leads 
ADD COLUMN IF NOT EXISTS scheduled_for timestamp with time zone,
ADD COLUMN IF NOT EXISTS batch_number integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS processing_order integer DEFAULT 0;

-- Create execution_logs table for detailed tracking
CREATE TABLE IF NOT EXISTS execution_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid REFERENCES campaigns(id),
  lead_id uuid REFERENCES campaign_leads(id),
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  webhook_response text,
  error_details text,
  retry_count integer DEFAULT 0,
  execution_time timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on execution_logs
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for execution_logs
CREATE POLICY "Users can view logs from own campaigns" 
ON execution_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM campaigns 
  WHERE campaigns.id = execution_logs.campaign_id 
  AND campaigns.user_id = auth.uid()
));

CREATE POLICY "Users can create logs for own campaigns" 
ON execution_logs 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM campaigns 
  WHERE campaigns.id = execution_logs.campaign_id 
  AND campaigns.user_id = auth.uid()
));

-- Create function to calculate next execution time with timezone support
CREATE OR REPLACE FUNCTION calculate_next_execution_time(
  campaign_id_param uuid,
  reference_time timestamp with time zone DEFAULT now()
) RETURNS timestamp with time zone
LANGUAGE plpgsql
AS $$
DECLARE
  campaign_record campaigns%ROWTYPE;
  next_execution timestamp with time zone;
  target_timezone text;
  local_time timestamp;
  current_day integer;
  next_valid_day integer;
  days_to_add integer;
  start_time_today timestamp with time zone;
  end_time_today timestamp with time zone;
BEGIN
  -- Get campaign details
  SELECT * INTO campaign_record FROM campaigns WHERE id = campaign_id_param;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  target_timezone := campaign_record.timezone;
  
  -- Convert reference time to campaign timezone
  local_time := reference_time AT TIME ZONE target_timezone;
  current_day := EXTRACT(DOW FROM local_time); -- 0=Sunday, 1=Monday, etc.
  
  -- Convert PostgreSQL day (0=Sunday) to our format (1=Monday, 7=Sunday)
  IF current_day = 0 THEN
    current_day := 7;
  END IF;
  
  -- Check if current day is in schedule and we're within time window
  IF campaign_record.schedule_days ? current_day::text THEN
    start_time_today := (local_time::date + campaign_record.start_time) AT TIME ZONE target_timezone;
    end_time_today := (local_time::date + campaign_record.end_time) AT TIME ZONE target_timezone;
    
    -- If we're before start time today, return start time today
    IF reference_time < start_time_today THEN
      RETURN start_time_today;
    END IF;
    
    -- If we're within the window, return next batch time
    IF reference_time >= start_time_today AND reference_time < end_time_today THEN
      -- Add interval minutes to current time, but don't exceed end time
      next_execution := reference_time + (campaign_record.interval_minutes || ' minutes')::interval;
      IF next_execution <= end_time_today THEN
        RETURN next_execution;
      END IF;
    END IF;
  END IF;
  
  -- Find next valid day
  days_to_add := 1;
  next_valid_day := current_day;
  
  LOOP
    next_valid_day := next_valid_day + 1;
    IF next_valid_day > 7 THEN
      next_valid_day := 1;
    END IF;
    
    IF campaign_record.schedule_days ? next_valid_day::text THEN
      EXIT;
    END IF;
    
    days_to_add := days_to_add + 1;
    IF days_to_add > 7 THEN
      -- No valid days found in schedule
      RETURN NULL;
    END IF;
  END LOOP;
  
  -- Calculate next execution time
  next_execution := ((local_time::date + days_to_add) + campaign_record.start_time) AT TIME ZONE target_timezone;
  
  RETURN next_execution;
END;
$$;

-- Create function to process campaign batches
CREATE OR REPLACE FUNCTION process_campaign_batch(campaign_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  campaign_record campaigns%ROWTYPE;
  lead_record campaign_leads%ROWTYPE;
  leads_to_process campaign_leads[];
  current_batch_number integer;
  processing_count integer := 0;
BEGIN
  -- Get campaign details
  SELECT * INTO campaign_record FROM campaigns WHERE id = campaign_id_param AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Campaign not found or not active');
  END IF;
  
  -- Get current batch number
  SELECT COALESCE(MAX(batch_number), 0) + 1 INTO current_batch_number
  FROM campaign_leads 
  WHERE campaign_id = campaign_id_param;
  
  -- Get next batch of leads to process
  SELECT array_agg(cl ORDER BY cl.created_at) INTO leads_to_process
  FROM (
    SELECT * FROM campaign_leads 
    WHERE campaign_id = campaign_id_param 
    AND status = 'pending'
    LIMIT campaign_record.batch_size
  ) cl;
  
  IF array_length(leads_to_process, 1) = 0 THEN
    -- No more leads to process, mark campaign as completed
    UPDATE campaigns 
    SET status = 'completed', updated_at = now()
    WHERE id = campaign_id_param;
    
    RETURN jsonb_build_object('status', 'completed', 'message', 'All leads processed');
  END IF;
  
  -- Mark leads as processing and assign batch info
  FOREACH lead_record IN ARRAY leads_to_process LOOP
    processing_count := processing_count + 1;
    
    UPDATE campaign_leads 
    SET 
      status = 'processing',
      batch_number = current_batch_number,
      processing_order = processing_count,
      scheduled_for = now() + (processing_count * campaign_record.processing_delay_seconds || ' seconds')::interval
    WHERE id = lead_record.id;
  END LOOP;
  
  -- Update campaign stats
  UPDATE campaigns 
  SET 
    last_processed_at = now(),
    next_batch_at = calculate_next_execution_time(campaign_id_param, now()),
    updated_at = now()
  WHERE id = campaign_id_param;
  
  -- Log the batch processing
  INSERT INTO execution_logs (campaign_id, action, details)
  VALUES (
    campaign_id_param,
    'batch_scheduled',
    jsonb_build_object(
      'batch_number', current_batch_number,
      'leads_count', array_length(leads_to_process, 1),
      'next_batch_at', calculate_next_execution_time(campaign_id_param, now())
    )
  );
  
  RETURN jsonb_build_object(
    'status', 'success',
    'batch_number', current_batch_number,
    'leads_scheduled', array_length(leads_to_process, 1),
    'next_batch_at', calculate_next_execution_time(campaign_id_param, now())
  );
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaign_leads_status_campaign ON campaign_leads(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_scheduled_for ON campaign_leads(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaigns_status_next_batch ON campaigns(status, next_batch_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_execution_logs_campaign_created ON execution_logs(campaign_id, created_at);

-- Enable realtime for all tables
ALTER TABLE campaigns REPLICA IDENTITY FULL;
ALTER TABLE campaign_leads REPLICA IDENTITY FULL;
ALTER TABLE execution_logs REPLICA IDENTITY FULL;

-- Add tables to realtime publication
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;