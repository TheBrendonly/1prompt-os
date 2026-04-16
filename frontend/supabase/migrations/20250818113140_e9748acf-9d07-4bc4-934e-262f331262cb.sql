-- Security Fixes Migration (Fixed Version)

-- 1. Add missing trigger for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add trigger for campaigns table if not exists
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON public.campaigns;
CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Add trigger to auto-set user_id on campaigns
DROP TRIGGER IF EXISTS set_campaign_user_id_trigger ON public.campaigns;
CREATE TRIGGER set_campaign_user_id_trigger
BEFORE INSERT ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.set_campaign_user_id();

-- 4. Enhanced webhook URL validation function
CREATE OR REPLACE FUNCTION public.validate_webhook_url_enhanced(url text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Basic URL format validation
  IF url IS NULL OR url = '' THEN
    RETURN false;
  END IF;
  
  -- Must start with https:// for security
  IF NOT url ~ '^https://' THEN
    RETURN false;
  END IF;
  
  -- Block localhost, private IPs, and suspicious patterns
  IF url ~ '(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|0\.0\.0\.0|255\.255\.255\.255)' THEN
    RETURN false;
  END IF;
  
  -- Block suspicious ports
  IF url ~ ':(22|23|25|53|80|135|139|445|993|995|1433|3306|3389|5432|5984|6379|11211|27017)/' THEN
    RETURN false;
  END IF;
  
  -- Must contain valid domain structure
  IF NOT url ~ '^https://[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$function$;

-- 5. Add webhook validation trigger for campaigns
CREATE OR REPLACE FUNCTION public.validate_campaign_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.webhook_url IS NOT NULL AND NOT public.validate_webhook_url_enhanced(NEW.webhook_url) THEN
    RAISE EXCEPTION 'Invalid webhook URL: Must be HTTPS and not point to private/local networks';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS validate_campaign_webhook_trigger ON public.campaigns;
CREATE TRIGGER validate_campaign_webhook_trigger
BEFORE INSERT OR UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.validate_campaign_webhook();

-- 6. Add webhook validation trigger for knowledge_base
DROP TRIGGER IF EXISTS validate_kb_webhook_trigger ON public.knowledge_base;
CREATE TRIGGER validate_kb_webhook_trigger
BEFORE INSERT OR UPDATE ON public.knowledge_base
FOR EACH ROW
EXECUTE FUNCTION public.validate_campaign_webhook();

-- 7. Add webhook validation trigger for prompts
DROP TRIGGER IF EXISTS validate_prompts_webhook_trigger ON public.prompts;
CREATE TRIGGER validate_prompts_webhook_trigger
BEFORE INSERT OR UPDATE ON public.prompts
FOR EACH ROW
EXECUTE FUNCTION public.validate_campaign_webhook();

-- 8. Remove DELETE policies from execution_logs to protect audit trail
DROP POLICY IF EXISTS "Users can delete logs for their agency campaigns" ON public.execution_logs;

-- 9. Enhance RLS for profiles table to prevent privilege escalation
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND id = OLD.id); -- Prevent ID changes

CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 10. Add rate limiting function for webhook calls
CREATE OR REPLACE FUNCTION public.check_webhook_rate_limit(campaign_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  recent_calls integer;
BEGIN
  -- Check webhook calls in last minute (max 60 per minute per campaign)
  SELECT COUNT(*) 
  INTO recent_calls
  FROM public.execution_logs
  WHERE campaign_id = campaign_id_param 
  AND execution_time > now() - interval '1 minute'
  AND status IN ('success', 'error');
  
  RETURN recent_calls < 60;
END;
$function$;