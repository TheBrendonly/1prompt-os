-- Add analytics_type to custom_metrics to separate Text vs Voice metrics
ALTER TABLE public.custom_metrics
ADD COLUMN IF NOT EXISTS analytics_type text NOT NULL DEFAULT 'text';

-- Optional: constrain acceptable values via CHECK (simple, not time-based)
ALTER TABLE public.custom_metrics
ADD CONSTRAINT custom_metrics_analytics_type_check
CHECK (analytics_type IN ('text','voice'));

-- Index for fast lookups by client and type
CREATE INDEX IF NOT EXISTS idx_custom_metrics_client_type
ON public.custom_metrics (client_id, analytics_type);
