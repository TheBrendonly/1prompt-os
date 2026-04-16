-- Fix scheduling issue: reschedule all pending leads to be within campaign windows
-- First, let's reschedule the current campaign's leads to be within the time window

UPDATE public.leads 
SET scheduled_for = (
  SELECT 
    -- Get the campaign's timezone and schedule within business hours
    CASE 
      -- If it's currently within business hours today, schedule for now
      WHEN EXTRACT(hour FROM (now() AT TIME ZONE c.timezone)) >= EXTRACT(hour FROM c.start_time::time)
           AND EXTRACT(hour FROM (now() AT TIME ZONE c.timezone)) < EXTRACT(hour FROM c.end_time::time)
           AND EXTRACT(dow FROM (now() AT TIME ZONE c.timezone)) = ANY(c.days_of_week)
      THEN now()
      
      -- Otherwise, schedule for tomorrow at start time
      ELSE (date_trunc('day', now() AT TIME ZONE c.timezone) + interval '1 day' + c.start_time::time) AT TIME ZONE c.timezone
    END
  FROM public.campaigns c 
  WHERE c.id = leads.campaign_id
)
FROM public.campaigns c
WHERE leads.campaign_id = c.id 
  AND leads.status = 'pending'
  AND c.status = 'active';