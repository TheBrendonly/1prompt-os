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
      'contact_data', COALESCE(NEW.contact_data, '{}'::jsonb)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    trigger_type := 'contact_updated';
    _client_id := NEW.client_id;
    trigger_payload := jsonb_build_object(
      'contact_id', NEW.id,
      'client_id', NEW.client_id,
      'contact_data', COALESCE(NEW.contact_data, '{}'::jsonb),
      'previous_data', COALESCE(OLD.contact_data, '{}'::jsonb)
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