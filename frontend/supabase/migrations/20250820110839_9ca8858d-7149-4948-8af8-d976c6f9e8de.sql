-- Phase 1: Database hardening

-- Add lead fingerprint for deduplication
ALTER TABLE public.leads 
ADD COLUMN lead_fingerprint TEXT;

-- Function to compute normalized lead fingerprint
CREATE OR REPLACE FUNCTION public.compute_lead_fingerprint(lead_data_param jsonb)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Trigger to set lead fingerprint
CREATE OR REPLACE FUNCTION public.set_lead_fingerprint()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.lead_fingerprint := public.compute_lead_fingerprint(NEW.lead_data);
  RETURN NEW;
END;
$$;

-- Attach fingerprint trigger
CREATE TRIGGER set_lead_fingerprint_trigger
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.set_lead_fingerprint();

-- Attach existing validation triggers
CREATE TRIGGER validate_lead_data_trigger
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_lead_data();

CREATE TRIGGER audit_lead_data_access_trigger
  AFTER INSERT OR UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_lead_data_access();

CREATE TRIGGER validate_campaign_webhook_trigger
  BEFORE INSERT OR UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_campaign_webhook();

-- Update existing leads to set fingerprint
UPDATE public.leads 
SET lead_fingerprint = public.compute_lead_fingerprint(lead_data)
WHERE lead_fingerprint IS NULL;

-- Create unique index for deduplication
CREATE UNIQUE INDEX leads_campaign_fingerprint_unique_idx 
ON public.leads (campaign_id, lead_fingerprint) 
WHERE lead_fingerprint IS NOT NULL;

-- Performance indexes
CREATE INDEX IF NOT EXISTS leads_campaign_status_scheduled_idx 
ON public.leads (campaign_id, status, scheduled_for);

CREATE INDEX IF NOT EXISTS execution_logs_campaign_time_idx 
ON public.execution_logs (campaign_id, execution_time DESC);

CREATE INDEX IF NOT EXISTS campaigns_status_idx 
ON public.campaigns (status);

-- Trigger for campaign completion check
CREATE TRIGGER check_campaign_completion_trigger
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  WHEN (NEW.status IN ('completed', 'failed') AND OLD.status != NEW.status)
  EXECUTE FUNCTION public.check_campaign_completion();