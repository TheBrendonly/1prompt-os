
-- Rename ghl_contact_id → lead_id in all 5 tables
ALTER TABLE public.active_trigger_runs RENAME COLUMN ghl_contact_id TO lead_id;
ALTER TABLE public.dm_executions RENAME COLUMN ghl_contact_id TO lead_id;
ALTER TABLE public.engagement_executions RENAME COLUMN ghl_contact_id TO lead_id;
ALTER TABLE public.followup_timers RENAME COLUMN ghl_contact_id TO lead_id;
ALTER TABLE public.message_queue RENAME COLUMN ghl_contact_id TO lead_id;

-- Recreate update_lead_last_message_at to use lead_id
CREATE OR REPLACE FUNCTION public.update_lead_last_message_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE leads
  SET last_message_at = NEW.started_at
  WHERE lead_id = NEW.lead_id
    AND client_id = (
      SELECT id FROM clients WHERE ghl_location_id = NEW.ghl_account_id LIMIT 1
    )
    AND (last_message_at IS NULL OR NEW.started_at > last_message_at);
  RETURN NEW;
END;
$function$;

-- Recreate sync_followup_timer_to_execution to use lead_id
CREATE OR REPLACE FUNCTION public.sync_followup_timer_to_execution()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE dm_executions
  SET followup_status = 'waiting',
      followup_resume_at = NEW.fires_at
  WHERE id = (
    SELECT id FROM dm_executions
    WHERE lead_id = NEW.lead_id
      AND ghl_account_id = NEW.ghl_account_id
      AND status = 'completed'
    ORDER BY started_at DESC
    LIMIT 1
  );
  RETURN NEW;
END;
$function$;

-- Recreate sync_followup_timer_status_change to use lead_id
CREATE OR REPLACE FUNCTION public.sync_followup_timer_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status IN ('cancelled', 'fired', 'failed') AND OLD.status = 'pending' THEN
    UPDATE dm_executions
    SET followup_status = NEW.status,
        followup_resume_at = CASE WHEN NEW.status = 'cancelled' THEN NULL ELSE followup_resume_at END
    WHERE id = (
      SELECT id FROM dm_executions
      WHERE lead_id = NEW.lead_id
        AND ghl_account_id = NEW.ghl_account_id
        AND followup_status = 'waiting'
      ORDER BY started_at DESC
      LIMIT 1
    );
  END IF;
  RETURN NEW;
END;
$function$;
