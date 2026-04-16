
-- Step 1: Add new real columns to contacts table
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb;

-- Step 2: Migrate existing data from contact_data JSONB into the new columns
UPDATE public.contacts SET
  first_name = COALESCE(
    NULLIF(contact_data->>'first_name', ''),
    NULLIF(contact_data->>'First Name', ''),
    NULLIF(contact_data->>'firstName', ''),
    NULLIF(split_part(COALESCE(NULLIF(contact_data->>'contact_name', ''), NULLIF(contact_data->>'name', ''), NULLIF(contact_data->>'Name', ''), NULLIF(contact_data->>'full_name', '')), ' ', 1), '')
  ),
  last_name = COALESCE(
    NULLIF(contact_data->>'last_name', ''),
    NULLIF(contact_data->>'Last Name', ''),
    NULLIF(contact_data->>'lastName', ''),
    NULLIF(
      trim(substring(
        COALESCE(NULLIF(contact_data->>'contact_name', ''), NULLIF(contact_data->>'name', ''), NULLIF(contact_data->>'Name', ''), NULLIF(contact_data->>'full_name', ''), '')
        from position(' ' in COALESCE(NULLIF(contact_data->>'contact_name', ''), NULLIF(contact_data->>'name', ''), NULLIF(contact_data->>'Name', ''), NULLIF(contact_data->>'full_name', ''), ''))
      )),
      ''
    )
  ),
  phone = COALESCE(
    NULLIF(contact_data->>'phone', ''),
    NULLIF(contact_data->>'Phone', ''),
    NULLIF(contact_data->>'Phone Number', ''),
    NULLIF(contact_data->>'phone_number', '')
  ),
  email = COALESCE(
    NULLIF(contact_data->>'email', ''),
    NULLIF(contact_data->>'Email', ''),
    NULLIF(contact_data->>'Email Address', ''),
    NULLIF(contact_data->>'email_address', '')
  ),
  business_name = COALESCE(
    NULLIF(contact_data->>'business_name', ''),
    NULLIF(contact_data->>'Business Name', ''),
    NULLIF(contact_data->>'Company', ''),
    NULLIF(contact_data->>'company', ''),
    NULLIF(contact_data->>'Company Name', ''),
    NULLIF(contact_data->>'company_name', ''),
    NULLIF(contact_data->>'Organization', '')
  )
WHERE contact_data IS NOT NULL AND contact_data != '{}'::jsonb;

-- Step 3: Update the trigger function to pass real columns instead of contact_data blob
CREATE OR REPLACE FUNCTION public.trigger_workflow_on_contact_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  trigger_type text;
  trigger_payload jsonb;
  _client_id uuid;
  supabase_url text;
  service_key text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    trigger_type := 'contact_created';
    _client_id := NEW.client_id;
    trigger_payload := jsonb_build_object(
      'contact_id', NEW.id,
      'client_id', NEW.client_id,
      'first_name', COALESCE(NEW.first_name, ''),
      'last_name', COALESCE(NEW.last_name, ''),
      'phone', COALESCE(NEW.phone, ''),
      'email', COALESCE(NEW.email, ''),
      'business_name', COALESCE(NEW.business_name, ''),
      'custom_fields', COALESCE(NEW.custom_fields, '{}'::jsonb),
      'contact_data', COALESCE(NEW.contact_data, '{}'::jsonb)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    trigger_type := 'contact_updated';
    _client_id := NEW.client_id;
    trigger_payload := jsonb_build_object(
      'contact_id', NEW.id,
      'client_id', NEW.client_id,
      'first_name', COALESCE(NEW.first_name, ''),
      'last_name', COALESCE(NEW.last_name, ''),
      'phone', COALESCE(NEW.phone, ''),
      'email', COALESCE(NEW.email, ''),
      'business_name', COALESCE(NEW.business_name, ''),
      'custom_fields', COALESCE(NEW.custom_fields, '{}'::jsonb),
      'contact_data', COALESCE(NEW.contact_data, '{}'::jsonb),
      'previous_first_name', COALESCE(OLD.first_name, ''),
      'previous_last_name', COALESCE(OLD.last_name, ''),
      'previous_phone', COALESCE(OLD.phone, ''),
      'previous_email', COALESCE(OLD.email, ''),
      'previous_business_name', COALESCE(OLD.business_name, '')
    );
  ELSIF TG_OP = 'DELETE' THEN
    trigger_type := 'contact_deleted';
    _client_id := OLD.client_id;
    trigger_payload := jsonb_build_object(
      'contact_id', OLD.id,
      'client_id', OLD.client_id
    );
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.workflows
    WHERE client_id = _client_id
      AND is_active = true
      AND nodes::text LIKE '%' || trigger_type || '%'
  ) THEN
    SELECT current_setting('app.settings.supabase_url', true) INTO supabase_url;
    SELECT current_setting('app.settings.service_role_key', true) INTO service_key;

    IF supabase_url IS NULL OR supabase_url = '' THEN
      supabase_url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1);
    END IF;
    IF service_key IS NULL OR service_key = '' THEN
      service_key := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1);
    END IF;

    IF supabase_url IS NOT NULL AND supabase_url <> '' AND service_key IS NOT NULL AND service_key <> '' THEN
      PERFORM net.http_post(
        url := supabase_url || '/functions/v1/workflow-execute',
        body := jsonb_build_object(
          'trigger_type', trigger_type,
          'trigger_data', trigger_payload,
          'client_id', _client_id::text
        ),
        params := '{}'::jsonb,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_key
        ),
        timeout_milliseconds := 5000
      );
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;
