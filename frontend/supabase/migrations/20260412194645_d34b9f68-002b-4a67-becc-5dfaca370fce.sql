
CREATE OR REPLACE FUNCTION public.get_avg_response_minutes(p_campaign_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH reply_times AS (
    SELECT
      r.execution_id,
      r.occurred_at AS reply_at,
      (SELECT MAX(m.occurred_at) FROM campaign_events m
       WHERE m.execution_id = r.execution_id AND m.event_type = 'message_sent') AS last_sent_at
    FROM campaign_events r
    WHERE r.campaign_id = p_campaign_id AND r.event_type = 'reply_received'
  )
  SELECT ROUND(AVG(EXTRACT(EPOCH FROM (reply_at - last_sent_at)) / 60)::numeric, 1)
  FROM reply_times WHERE last_sent_at IS NOT NULL;
$$;
