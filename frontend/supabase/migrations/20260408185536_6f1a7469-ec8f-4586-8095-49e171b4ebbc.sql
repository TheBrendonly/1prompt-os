CREATE OR REPLACE FUNCTION public.sync_followup_timer_to_execution()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update the most recent dm_execution for this contact with follow-up info
  UPDATE dm_executions
  SET followup_status = 'waiting',
      followup_resume_at = NEW.fires_at
  WHERE id = (
    SELECT id FROM dm_executions
    WHERE ghl_contact_id = NEW.ghl_contact_id
      AND ghl_account_id = NEW.ghl_account_id
      AND status = 'completed'
    ORDER BY started_at DESC
    LIMIT 1
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_followup_timer_insert
AFTER INSERT ON public.followup_timers
FOR EACH ROW
EXECUTE FUNCTION public.sync_followup_timer_to_execution();

-- Also handle when a followup_timer status changes (cancelled/fired/failed)
CREATE OR REPLACE FUNCTION public.sync_followup_timer_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When timer is cancelled, fired, or failed, update the execution
  IF NEW.status IN ('cancelled', 'fired', 'failed') AND OLD.status = 'pending' THEN
    UPDATE dm_executions
    SET followup_status = NEW.status,
        followup_resume_at = CASE WHEN NEW.status = 'cancelled' THEN NULL ELSE followup_resume_at END
    WHERE id = (
      SELECT id FROM dm_executions
      WHERE ghl_contact_id = NEW.ghl_contact_id
        AND ghl_account_id = NEW.ghl_account_id
        AND followup_status = 'waiting'
      ORDER BY started_at DESC
      LIMIT 1
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_followup_timer_update
AFTER UPDATE OF status ON public.followup_timers
FOR EACH ROW
EXECUTE FUNCTION public.sync_followup_timer_status_change();