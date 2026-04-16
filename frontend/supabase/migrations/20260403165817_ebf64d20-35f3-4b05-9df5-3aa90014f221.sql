
-- Step 1: Add tags jsonb column
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb;

-- Step 2: Migrate contact_data into custom_fields (merge, don't overwrite)
-- Only migrate keys that aren't standard columns or system keys
UPDATE public.contacts
SET custom_fields = COALESCE(custom_fields, '{}'::jsonb) || (
  SELECT COALESCE(jsonb_object_agg(key, value), '{}'::jsonb)
  FROM jsonb_each(COALESCE(contact_data, '{}'::jsonb))
  WHERE key NOT IN (
    'id', 'contact_id', 'session_id', 'created_at', 'updated_at',
    'custom_fields', '_synced_from_external',
    'first_name', 'last_name', 'email', 'phone', 'business_name',
    'tags'
  )
)
WHERE contact_data IS NOT NULL AND contact_data != '{}'::jsonb;

-- Step 3: Migrate tags from contact_data string to new tags jsonb column
-- Convert comma-separated tag strings to jsonb array of objects
UPDATE public.contacts
SET tags = (
  SELECT COALESCE(jsonb_agg(jsonb_build_object('name', trim(t), 'color', '#646E82')), '[]'::jsonb)
  FROM unnest(string_to_array(contact_data->>'tags', ',')) AS t
  WHERE trim(t) != ''
)
WHERE contact_data->>'tags' IS NOT NULL AND contact_data->>'tags' != '';

-- Step 4: Drop the contact_data column
ALTER TABLE public.contacts DROP COLUMN IF EXISTS contact_data;

-- Step 5: Update the trigger function to remove contact_data and add tags
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
      'tags', COALESCE(NEW.tags, '[]'::jsonb)
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
      'tags', COALESCE(NEW.tags, '[]'::jsonb),
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
