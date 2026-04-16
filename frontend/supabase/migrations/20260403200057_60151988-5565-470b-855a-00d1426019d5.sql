-- PHASE 1: Rename existing campaign leads table to campaign_leads
ALTER TABLE public.leads RENAME TO campaign_leads;

-- Update RLS policies on campaign_leads
DROP POLICY IF EXISTS "Users can manage leads for their campaigns" ON public.campaign_leads;
CREATE POLICY "Users can manage leads for their campaigns"
ON public.campaign_leads
FOR ALL
TO public
USING (
  campaign_id IN (
    SELECT campaigns.id FROM campaigns
    WHERE campaigns.client_id IN (
      SELECT clients.id FROM clients
      WHERE clients.agency_id IN (
        SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid()
      )
    )
  )
);

-- Update get_secure_leads function to reference campaign_leads
CREATE OR REPLACE FUNCTION public.get_secure_leads(campaign_id_filter uuid)
 RETURNS SETOF campaign_leads
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT * FROM public.campaign_leads WHERE campaign_id = campaign_id_filter ORDER BY created_at ASC;
$function$;

-- Update delete_campaign_with_data function
CREATE OR REPLACE FUNCTION public.delete_campaign_with_data(campaign_id_param uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.campaign_leads WHERE campaign_id = campaign_id_param;
  DELETE FROM public.campaigns WHERE id = campaign_id_param;
END;
$function$;

-- PHASE 2: Rename contacts to leads
ALTER TABLE public.contacts RENAME TO leads;
ALTER TABLE public.leads RENAME COLUMN contact_id TO lead_id;

-- Rename related tables
ALTER TABLE public.contact_tags RENAME TO lead_tags;
ALTER TABLE public.contact_tag_assignments RENAME TO lead_tag_assignments;
ALTER TABLE public.contact_ai_columns RENAME TO lead_ai_columns;
ALTER TABLE public.contact_ai_values RENAME TO lead_ai_values;

-- Rename FK columns
ALTER TABLE public.lead_tag_assignments RENAME COLUMN contact_id TO lead_id;
ALTER TABLE public.lead_ai_values RENAME COLUMN contact_id TO lead_id;
ALTER TABLE public.calendar_events RENAME COLUMN contact_id TO lead_id;

-- RLS for leads
DROP POLICY IF EXISTS "Users can manage contacts for their clients" ON public.leads;
CREATE POLICY "Users can manage leads for their clients"
ON public.leads FOR ALL TO public
USING (client_id IN (SELECT clients.id FROM clients WHERE clients.agency_id IN (SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid())));

-- RLS for lead_tags
DROP POLICY IF EXISTS "Users can manage contact tags" ON public.lead_tags;
CREATE POLICY "Users can manage lead tags"
ON public.lead_tags FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- RLS for lead_tag_assignments
DROP POLICY IF EXISTS "Users can manage tag assignments" ON public.lead_tag_assignments;
CREATE POLICY "Users can manage lead tag assignments"
ON public.lead_tag_assignments FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- RLS for lead_ai_columns
DROP POLICY IF EXISTS "Users can manage AI columns for their clients" ON public.lead_ai_columns;
CREATE POLICY "Users can manage AI columns for their clients"
ON public.lead_ai_columns FOR ALL TO public
USING (client_id IN (SELECT clients.id FROM clients WHERE clients.agency_id IN (SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid())));

-- RLS for lead_ai_values
DROP POLICY IF EXISTS "Users can manage AI values" ON public.lead_ai_values;
CREATE POLICY "Users can manage AI values"
ON public.lead_ai_values FOR ALL TO public
USING (lead_id IN (SELECT leads.id FROM leads WHERE leads.client_id IN (SELECT clients.id FROM clients WHERE clients.agency_id IN (SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid()))));

-- Update trigger function
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
      'lead_id', NEW.id, 'client_id', NEW.client_id,
      'first_name', COALESCE(NEW.first_name, ''), 'last_name', COALESCE(NEW.last_name, ''),
      'phone', COALESCE(NEW.phone, ''), 'email', COALESCE(NEW.email, ''),
      'business_name', COALESCE(NEW.business_name, ''),
      'custom_fields', COALESCE(NEW.custom_fields, '{}'::jsonb),
      'tags', COALESCE(NEW.tags, '[]'::jsonb)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    trigger_type := 'contact_updated';
    _client_id := NEW.client_id;
    trigger_payload := jsonb_build_object(
      'lead_id', NEW.id, 'client_id', NEW.client_id,
      'first_name', COALESCE(NEW.first_name, ''), 'last_name', COALESCE(NEW.last_name, ''),
      'phone', COALESCE(NEW.phone, ''), 'email', COALESCE(NEW.email, ''),
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
    trigger_payload := jsonb_build_object('lead_id', OLD.id, 'client_id', OLD.client_id);
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.workflows
    WHERE client_id = _client_id AND is_active = true AND nodes::text LIKE '%' || trigger_type || '%'
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
        body := jsonb_build_object('trigger_type', trigger_type, 'trigger_data', trigger_payload, 'client_id', _client_id::text),
        params := '{}'::jsonb,
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || service_key),
        timeout_milliseconds := 5000
      );
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Reattach trigger
DROP TRIGGER IF EXISTS on_contact_change ON public.leads;
CREATE TRIGGER on_lead_change
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.trigger_workflow_on_contact_change();