-- Add Go High Level API settings to clients table
ALTER TABLE public.clients 
ADD COLUMN ghl_api_key TEXT,
ADD COLUMN ghl_assignee_id TEXT,
ADD COLUMN ghl_calendar_id TEXT,
ADD COLUMN ghl_location_id TEXT,
ADD COLUMN api_webhook_url TEXT;

-- Add webhook validation trigger for API webhook URL
CREATE OR REPLACE FUNCTION public.validate_api_webhook()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.api_webhook_url IS NOT NULL AND NOT public.validate_webhook_url_enhanced(NEW.api_webhook_url) THEN
    RAISE EXCEPTION 'Invalid API webhook URL: Must be HTTPS and not point to private/local networks';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for webhook validation
CREATE TRIGGER validate_api_webhook_trigger
  BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_api_webhook();