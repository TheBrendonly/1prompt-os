-- Ensure unique color preference per client and metric
-- 1) Deduplicate existing rows (keep most recent)
WITH ranked AS (
  SELECT id, client_id, metric_name, updated_at,
         ROW_NUMBER() OVER (PARTITION BY client_id, metric_name ORDER BY updated_at DESC, id DESC) AS rn
  FROM public.metric_color_preferences
)
DELETE FROM public.metric_color_preferences m
USING ranked r
WHERE m.id = r.id AND r.rn > 1;

-- 2) Add unique constraint (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'metric_color_preferences_client_metric_unique'
  ) THEN
    ALTER TABLE public.metric_color_preferences
    ADD CONSTRAINT metric_color_preferences_client_metric_unique UNIQUE (client_id, metric_name);
  END IF;
END $$;

-- 3) Improve realtime payloads for this table
ALTER TABLE public.metric_color_preferences REPLICA IDENTITY FULL;