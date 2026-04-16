-- Add two new webhook columns to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS transfer_to_human_webhook_url TEXT,
ADD COLUMN IF NOT EXISTS user_details_webhook_url TEXT;

-- Add validation triggers for the new webhook URLs
CREATE OR REPLACE FUNCTION public.validate_client_webhooks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validate transfer_to_human_webhook_url
  IF NEW.transfer_to_human_webhook_url IS NOT NULL AND NOT public.validate_webhook_url_enhanced(NEW.transfer_to_human_webhook_url) THEN
    RAISE EXCEPTION 'Invalid Transfer to Human webhook URL: Must be HTTPS and not point to private/local networks';
  END IF;
  
  -- Validate user_details_webhook_url
  IF NEW.user_details_webhook_url IS NOT NULL AND NOT public.validate_webhook_url_enhanced(NEW.user_details_webhook_url) THEN
    RAISE EXCEPTION 'Invalid User Details webhook URL: Must be HTTPS and not point to private/local networks';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for validating new webhooks
DROP TRIGGER IF EXISTS validate_client_webhooks_trigger ON public.clients;
CREATE TRIGGER validate_client_webhooks_trigger
  BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_client_webhooks();