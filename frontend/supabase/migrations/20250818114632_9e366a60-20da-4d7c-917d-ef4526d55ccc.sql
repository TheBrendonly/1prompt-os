-- Add automatic campaign completion logic

-- 1. Create function to check and update campaign completion status
CREATE OR REPLACE FUNCTION public.check_campaign_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_leads_count integer;
  processed_leads_count integer;
  campaign_id_val uuid;
BEGIN
  -- Get campaign_id from the lead that was updated
  campaign_id_val := NEW.campaign_id;
  
  -- Count total leads for this campaign
  SELECT COUNT(*) INTO total_leads_count
  FROM public.leads 
  WHERE campaign_id = campaign_id_val;
  
  -- Count processed leads (completed or failed)
  SELECT COUNT(*) INTO processed_leads_count
  FROM public.leads 
  WHERE campaign_id = campaign_id_val 
  AND status IN ('completed', 'failed');
  
  -- If all leads are processed, mark campaign as completed
  IF total_leads_count > 0 AND processed_leads_count = total_leads_count THEN
    UPDATE public.campaigns 
    SET 
      status = 'completed',
      processed_leads = processed_leads_count,
      updated_at = now()
    WHERE id = campaign_id_val;
    
    -- Log the completion
    INSERT INTO public.execution_logs (
      campaign_id, 
      status, 
      webhook_response,
      error_details
    ) VALUES (
      campaign_id_val,
      'AUDIT_CAMPAIGN_COMPLETED',
      json_build_object(
        'total_leads', total_leads_count,
        'processed_leads', processed_leads_count,
        'completion_time', now(),
        'auto_completed', true
      )::text,
      'Campaign automatically marked as completed - all leads processed'
    );
  ELSE
    -- Update processed count even if not complete
    UPDATE public.campaigns 
    SET 
      processed_leads = processed_leads_count,
      updated_at = now()
    WHERE id = campaign_id_val;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 2. Create trigger on leads table to auto-update campaign status
DROP TRIGGER IF EXISTS auto_complete_campaign_trigger ON public.leads;
CREATE TRIGGER auto_complete_campaign_trigger
AFTER UPDATE OR INSERT ON public.leads
FOR EACH ROW
WHEN (NEW.status IN ('completed', 'failed'))
EXECUTE FUNCTION public.check_campaign_completion();

-- 3. Update any existing campaigns that should be completed
UPDATE public.campaigns 
SET status = 'completed', updated_at = now()
WHERE id IN (
  SELECT c.id 
  FROM public.campaigns c
  WHERE c.status = 'active'
  AND c.total_leads > 0
  AND (
    SELECT COUNT(*) 
    FROM public.leads l 
    WHERE l.campaign_id = c.id 
    AND l.status IN ('completed', 'failed')
  ) = c.total_leads
);