-- Add database_reactivation_inbound_webhook_url column to clients table
ALTER TABLE public.clients 
ADD COLUMN database_reactivation_inbound_webhook_url text;

-- Add validation for the new webhook URL
CREATE OR REPLACE FUNCTION public.validate_client_webhooks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate transfer_to_human_webhook_url
  IF NEW.transfer_to_human_webhook_url IS NOT NULL AND NOT public.validate_webhook_url_enhanced(NEW.transfer_to_human_webhook_url) THEN
    RAISE EXCEPTION 'Invalid Transfer to Human webhook URL: Must be HTTPS and not point to private/local networks';
  END IF;
  
  -- Validate user_details_webhook_url
  IF NEW.user_details_webhook_url IS NOT NULL AND NOT public.validate_webhook_url_enhanced(NEW.user_details_webhook_url) THEN
    RAISE EXCEPTION 'Invalid User Details webhook URL: Must be HTTPS and not point to private/local networks';
  END IF;
  
  -- Validate database_reactivation_inbound_webhook_url
  IF NEW.database_reactivation_inbound_webhook_url IS NOT NULL AND NOT public.validate_webhook_url_enhanced(NEW.database_reactivation_inbound_webhook_url) THEN
    RAISE EXCEPTION 'Invalid Database Reactivation Inbound webhook URL: Must be HTTPS and not point to private/local networks';
  END IF;
  
  RETURN NEW;
END;
$function$;