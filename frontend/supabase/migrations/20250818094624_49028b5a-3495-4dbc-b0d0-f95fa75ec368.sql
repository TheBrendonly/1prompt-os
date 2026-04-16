-- Fix remaining security issues
-- Update set_campaign_user_id function to have proper search path
CREATE OR REPLACE FUNCTION public.set_campaign_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Set user_id to the authenticated user
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$function$;

-- Add constraint to ensure webhook URLs are validated
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS check_valid_webhook_url;
ALTER TABLE campaigns ADD CONSTRAINT check_valid_webhook_url 
  CHECK (validate_webhook_url(webhook_url));

-- Add constraint to ensure prompts webhook URLs are validated
ALTER TABLE prompts DROP CONSTRAINT IF EXISTS check_valid_prompt_webhook_url;
ALTER TABLE prompts ADD CONSTRAINT check_valid_prompt_webhook_url 
  CHECK (webhook_url IS NULL OR validate_webhook_url(webhook_url));

-- Add constraint to ensure knowledge_base webhook URLs are validated  
ALTER TABLE knowledge_base DROP CONSTRAINT IF EXISTS check_valid_kb_webhook_url;
ALTER TABLE knowledge_base ADD CONSTRAINT check_valid_kb_webhook_url 
  CHECK (webhook_url IS NULL OR validate_webhook_url(webhook_url));