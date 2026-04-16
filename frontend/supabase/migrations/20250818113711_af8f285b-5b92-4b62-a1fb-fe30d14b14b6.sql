-- Enhanced Lead Data Security Migration

-- 1. Create function to mask sensitive data in lead_data
CREATE OR REPLACE FUNCTION public.mask_sensitive_lead_data(lead_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  masked_data jsonb;
BEGIN
  -- Start with the original data
  masked_data := lead_data;
  
  -- Mask email addresses (show only first 2 chars + domain)
  IF masked_data ? 'email' AND masked_data->>'email' IS NOT NULL THEN
    masked_data := jsonb_set(
      masked_data, 
      '{email}', 
      to_jsonb(
        substring(masked_data->>'email', 1, 2) || '***@' || 
        split_part(masked_data->>'email', '@', 2)
      )
    );
  END IF;
  
  -- Mask phone numbers (show only last 4 digits)
  IF masked_data ? 'phone' AND masked_data->>'phone' IS NOT NULL THEN
    masked_data := jsonb_set(
      masked_data, 
      '{phone}', 
      to_jsonb('***-***-' || right(regexp_replace(masked_data->>'phone', '[^0-9]', '', 'g'), 4))
    );
  END IF;
  
  -- Mask SSN/Tax ID if present
  IF masked_data ? 'ssn' AND masked_data->>'ssn' IS NOT NULL THEN
    masked_data := jsonb_set(masked_data, '{ssn}', to_jsonb('***-**-' || right(masked_data->>'ssn', 4)));
  END IF;
  
  IF masked_data ? 'tax_id' AND masked_data->>'tax_id' IS NOT NULL THEN
    masked_data := jsonb_set(masked_data, '{tax_id}', to_jsonb('***-**-' || right(masked_data->>'tax_id', 4)));
  END IF;
  
  -- Mask credit card numbers if present
  IF masked_data ? 'credit_card' AND masked_data->>'credit_card' IS NOT NULL THEN
    masked_data := jsonb_set(
      masked_data, 
      '{credit_card}', 
      to_jsonb('****-****-****-' || right(regexp_replace(masked_data->>'credit_card', '[^0-9]', '', 'g'), 4))
    );
  END IF;
  
  RETURN masked_data;
END;
$function$;

-- 2. Create function to check if user has full data access rights
CREATE OR REPLACE FUNCTION public.user_has_full_lead_access(campaign_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_id_val uuid;
  is_campaign_owner boolean;
BEGIN
  user_id_val := auth.uid();
  
  IF user_id_val IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user owns the campaign
  SELECT EXISTS(
    SELECT 1 FROM campaigns 
    WHERE id = campaign_id_param 
    AND user_id = user_id_val
  ) INTO is_campaign_owner;
  
  RETURN is_campaign_owner;
END;
$function$;

-- 3. Create secure view for lead data with conditional masking
CREATE OR REPLACE VIEW public.secure_leads AS
SELECT 
  l.id,
  l.campaign_id,
  l.status,
  l.scheduled_for,
  l.processed_at,
  l.created_at,
  l.error_message,
  -- Conditionally mask lead_data based on user access level
  CASE 
    WHEN public.user_has_full_lead_access(l.campaign_id) THEN l.lead_data
    ELSE public.mask_sensitive_lead_data(l.lead_data)
  END as lead_data
FROM public.leads l
WHERE 
  -- Apply the same RLS logic as the leads table
  EXISTS (
    SELECT 1
    FROM ((campaigns c
      JOIN clients cl ON ((cl.id = c.client_id)))
      JOIN profiles p ON ((p.agency_id = cl.agency_id)))
    WHERE ((c.id = l.campaign_id) AND (p.id = auth.uid()))
  );

-- 4. Create audit logging function for sensitive data access
CREATE OR REPLACE FUNCTION public.audit_lead_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  has_sensitive_fields boolean;
BEGIN
  -- Check if lead_data contains sensitive information
  has_sensitive_fields := (
    NEW.lead_data ? 'email' OR 
    NEW.lead_data ? 'phone' OR 
    NEW.lead_data ? 'ssn' OR 
    NEW.lead_data ? 'tax_id' OR 
    NEW.lead_data ? 'credit_card'
  );
  
  -- Log access to sensitive data
  IF has_sensitive_fields THEN
    INSERT INTO public.execution_logs (
      campaign_id, 
      lead_id, 
      status, 
      webhook_response, 
      error_details
    ) VALUES (
      NEW.campaign_id,
      NEW.id,
      'AUDIT_SENSITIVE_ACCESS',
      json_build_object(
        'action', TG_OP,
        'user_id', auth.uid(),
        'timestamp', now(),
        'has_email', NEW.lead_data ? 'email',
        'has_phone', NEW.lead_data ? 'phone',
        'has_ssn', NEW.lead_data ? 'ssn'
      )::text,
      'Sensitive lead data accessed'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 5. Add trigger for audit logging
DROP TRIGGER IF EXISTS audit_lead_access_trigger ON public.leads;
CREATE TRIGGER audit_lead_access_trigger
AFTER INSERT OR UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.audit_lead_data_access();

-- 6. Add validation function for lead_data
CREATE OR REPLACE FUNCTION public.validate_lead_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate email format if present
  IF NEW.lead_data ? 'email' AND NEW.lead_data->>'email' IS NOT NULL THEN
    IF NOT (NEW.lead_data->>'email' ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') THEN
      RAISE EXCEPTION 'Invalid email format in lead_data';
    END IF;
  END IF;
  
  -- Validate phone format if present (basic validation)
  IF NEW.lead_data ? 'phone' AND NEW.lead_data->>'phone' IS NOT NULL THEN
    IF LENGTH(regexp_replace(NEW.lead_data->>'phone', '[^0-9]', '', 'g')) < 10 THEN
      RAISE EXCEPTION 'Invalid phone format in lead_data - must contain at least 10 digits';
    END IF;
  END IF;
  
  -- Prevent storage of obviously sensitive data that shouldn't be there
  IF NEW.lead_data::text ~* '(password|secret|token|key|auth)' THEN
    RAISE EXCEPTION 'Lead data cannot contain authentication credentials';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 7. Add validation trigger
DROP TRIGGER IF EXISTS validate_lead_data_trigger ON public.leads;
CREATE TRIGGER validate_lead_data_trigger
BEFORE INSERT OR UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.validate_lead_data();

-- 8. Create RLS policy for the secure view
ALTER VIEW public.secure_leads SET (security_invoker = true);

-- 9. Add enhanced RLS policies with better granular control
-- Drop existing policies to recreate with better controls
DROP POLICY IF EXISTS "Users can view leads for their agency campaigns" ON public.leads;
DROP POLICY IF EXISTS "Users can create leads for their agency campaigns" ON public.leads;  
DROP POLICY IF EXISTS "Users can update leads for their agency campaigns" ON public.leads;
DROP POLICY IF EXISTS "Users can delete leads for their agency campaigns" ON public.leads;

-- Recreate with enhanced security
CREATE POLICY "Enhanced lead access for agency users"
ON public.leads
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM ((campaigns c
      JOIN clients cl ON ((cl.id = c.client_id)))
      JOIN profiles p ON ((p.agency_id = cl.agency_id)))
    WHERE ((c.id = leads.campaign_id) AND (p.id = auth.uid()))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM ((campaigns c
      JOIN clients cl ON ((cl.id = c.client_id)))
      JOIN profiles p ON ((p.agency_id = cl.agency_id)))
    WHERE ((c.id = leads.campaign_id) AND (p.id = auth.uid()))
  )
);

-- 10. Create data retention policy function
CREATE OR REPLACE FUNCTION public.cleanup_old_lead_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Archive leads older than 2 years by removing sensitive data
  UPDATE public.leads 
  SET lead_data = jsonb_strip_nulls(jsonb_build_object(
    'archived_at', now(),
    'original_keys', array(SELECT jsonb_object_keys(lead_data))
  ))
  WHERE created_at < now() - interval '2 years'
  AND status = 'processed';
  
  -- Log the cleanup action
  INSERT INTO public.execution_logs (
    campaign_id, 
    status, 
    webhook_response
  ) VALUES (
    null,
    'AUDIT_DATA_CLEANUP',
    json_build_object(
      'action', 'archived_old_leads',
      'timestamp', now(),
      'user_id', 'system'
    )::text
  );
END;
$function$;