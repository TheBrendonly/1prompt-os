-- Phase 5c — custom_metrics + dependents on bfd-platform
-- Consolidates frontend migrations that were never applied here:
--   20250918203544 (base table + RLS + trigger)
--   20251002110352 (color column + metric_color_preferences table)
--   20251026191754 (analytics_type column + index)
--   20260306214838 (sort_order column)
--   20260313101610 (metric_analysis_results table + RLS + index)
--   20260320043525 (widget_type column)
--   20260325190723 (widget_width column)
--   20260412192839 (campaign_id FK column)
-- Idempotent. CHECK(max 5 active per client) deliberately omitted — frontend seeds
-- 4 text + 4 voice = 8 active per client out of the box.

-- =========================================================================
-- 1. custom_metrics base table + RLS + trigger
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.custom_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  prompt TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_metrics ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'custom_metrics' AND policyname = 'Users can create custom metrics for their agency clients') THEN
    CREATE POLICY "Users can create custom metrics for their agency clients"
      ON public.custom_metrics FOR INSERT
      WITH CHECK (EXISTS (
        SELECT 1 FROM clients
        JOIN profiles ON profiles.agency_id = clients.agency_id
        WHERE profiles.id = auth.uid() AND clients.id = custom_metrics.client_id
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'custom_metrics' AND policyname = 'Users can view custom metrics for their agency clients') THEN
    CREATE POLICY "Users can view custom metrics for their agency clients"
      ON public.custom_metrics FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM clients
        JOIN profiles ON profiles.agency_id = clients.agency_id
        WHERE profiles.id = auth.uid() AND clients.id = custom_metrics.client_id
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'custom_metrics' AND policyname = 'Users can update custom metrics for their agency clients') THEN
    CREATE POLICY "Users can update custom metrics for their agency clients"
      ON public.custom_metrics FOR UPDATE
      USING (EXISTS (
        SELECT 1 FROM clients
        JOIN profiles ON profiles.agency_id = clients.agency_id
        WHERE profiles.id = auth.uid() AND clients.id = custom_metrics.client_id
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'custom_metrics' AND policyname = 'Users can delete custom metrics for their agency clients') THEN
    CREATE POLICY "Users can delete custom metrics for their agency clients"
      ON public.custom_metrics FOR DELETE
      USING (EXISTS (
        SELECT 1 FROM clients
        JOIN profiles ON profiles.agency_id = clients.agency_id
        WHERE profiles.id = auth.uid() AND clients.id = custom_metrics.client_id
      ));
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_custom_metrics_updated_at ON public.custom_metrics;
CREATE TRIGGER update_custom_metrics_updated_at
  BEFORE UPDATE ON public.custom_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- 2. custom_metrics column adds (idempotent)
-- =========================================================================
ALTER TABLE public.custom_metrics ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6';
ALTER TABLE public.custom_metrics ADD COLUMN IF NOT EXISTS analytics_type TEXT DEFAULT 'text';
ALTER TABLE public.custom_metrics ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE public.custom_metrics ADD COLUMN IF NOT EXISTS widget_type TEXT DEFAULT 'number_card';
ALTER TABLE public.custom_metrics ADD COLUMN IF NOT EXISTS widget_width TEXT DEFAULT 'half';
ALTER TABLE public.custom_metrics ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.engagement_campaigns(id) ON DELETE SET NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'custom_metrics_analytics_type_check') THEN
    ALTER TABLE public.custom_metrics ADD CONSTRAINT custom_metrics_analytics_type_check CHECK (analytics_type IN ('text','voice','v2'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_custom_metrics_client_type ON public.custom_metrics(client_id, analytics_type);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_custom_metrics_client_type_name ON public.custom_metrics(client_id, analytics_type, name);

-- =========================================================================
-- 3. metric_color_preferences
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.metric_color_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, metric_name)
);

ALTER TABLE public.metric_color_preferences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'metric_color_preferences' AND policyname = 'Users can view color preferences for their agency clients') THEN
    CREATE POLICY "Users can view color preferences for their agency clients"
      ON public.metric_color_preferences FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM clients JOIN profiles ON profiles.agency_id = clients.agency_id
        WHERE profiles.id = auth.uid() AND clients.id = metric_color_preferences.client_id
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'metric_color_preferences' AND policyname = 'Users can create color preferences for their agency clients') THEN
    CREATE POLICY "Users can create color preferences for their agency clients"
      ON public.metric_color_preferences FOR INSERT
      WITH CHECK (EXISTS (
        SELECT 1 FROM clients JOIN profiles ON profiles.agency_id = clients.agency_id
        WHERE profiles.id = auth.uid() AND clients.id = metric_color_preferences.client_id
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'metric_color_preferences' AND policyname = 'Users can update color preferences for their agency clients') THEN
    CREATE POLICY "Users can update color preferences for their agency clients"
      ON public.metric_color_preferences FOR UPDATE
      USING (EXISTS (
        SELECT 1 FROM clients JOIN profiles ON profiles.agency_id = clients.agency_id
        WHERE profiles.id = auth.uid() AND clients.id = metric_color_preferences.client_id
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'metric_color_preferences' AND policyname = 'Users can delete color preferences for their agency clients') THEN
    CREATE POLICY "Users can delete color preferences for their agency clients"
      ON public.metric_color_preferences FOR DELETE
      USING (EXISTS (
        SELECT 1 FROM clients JOIN profiles ON profiles.agency_id = clients.agency_id
        WHERE profiles.id = auth.uid() AND clients.id = metric_color_preferences.client_id
      ));
  END IF;
END $$;

-- =========================================================================
-- 4. metric_analysis_results
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.metric_analysis_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_id UUID REFERENCES public.custom_metrics(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  time_range TEXT NOT NULL,
  analysis_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.metric_analysis_results ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'metric_analysis_results' AND policyname = 'Users can manage metric analysis for their clients') THEN
    CREATE POLICY "Users can manage metric analysis for their clients"
      ON public.metric_analysis_results FOR ALL TO authenticated
      USING (client_id IN (SELECT clients.id FROM clients WHERE clients.agency_id IN (SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid())))
      WITH CHECK (client_id IN (SELECT clients.id FROM clients WHERE clients.agency_id IN (SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid())));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_metric_analysis_lookup ON public.metric_analysis_results(metric_id, client_id, time_range);

-- =========================================================================
-- 5. Seed BFD defaults (4 text + 4 voice)
-- =========================================================================
INSERT INTO public.custom_metrics (client_id, analytics_type, name, description, prompt, color, widget_type, widget_width, sort_order, is_active)
VALUES
  ('e467dabc-57ee-416c-8831-83ecd9c7c925', 'text', 'Total Conversations', 'Total Conversations', 'Count the total number of distinct conversation sessions. Each unique conversation thread or session should be counted once.', '#3b82f6', 'number_card', 'half', 0, true),
  ('e467dabc-57ee-416c-8831-83ecd9c7c925', 'text', 'Total Bot Messages', 'Total Bot Messages', 'Count all messages in the chat history where the role is ''assistant'', ''bot'', or similar. Include any automated responses.', '#10b981', 'number_card', 'half', 1, true),
  ('e467dabc-57ee-416c-8831-83ecd9c7c925', 'text', 'Total Human Messages', 'Total Human Messages', 'Count all messages sent by human users in the chat history.', '#f59e0b', 'number_card', 'half', 2, true),
  ('e467dabc-57ee-416c-8831-83ecd9c7c925', 'text', 'New Users', 'New Users', 'Identify unique users in the chat history and count users who appear to be new or first-time users based on conversation patterns.', '#8b5cf6', 'number_card', 'half', 3, true),
  ('e467dabc-57ee-416c-8831-83ecd9c7c925', 'voice', 'New User Messages', 'New User Messages', 'Identify unique users in the voice call transcripts and count messages from users who appear to be new or first-time callers based on conversation patterns.', '#8b5cf6', 'number_card', 'half', 0, true),
  ('e467dabc-57ee-416c-8831-83ecd9c7c925', 'voice', 'Thank You Count', 'Thank You Count', 'Count instances where users express gratitude, thanks, appreciation, or similar positive acknowledgments in voice transcripts. Look for words like ''thank you'', ''thanks'', ''grateful'', ''appreciate'', etc.', '#10b981', 'number_card', 'half', 1, true),
  ('e467dabc-57ee-416c-8831-83ecd9c7c925', 'voice', 'Questions Asked', 'Questions Asked', 'Count all user messages in voice transcripts that contain questions. Look for question marks, interrogative words (who, what, when, where, why, how), and question patterns.', '#f59e0b', 'number_card', 'half', 2, true),
  ('e467dabc-57ee-416c-8831-83ecd9c7c925', 'voice', 'Total Voice Call', 'Total Voice Call', 'Count the total number of distinct voice call sessions. Each unique voice call or session should be counted once.', '#3b82f6', 'number_card', 'half', 3, true)
ON CONFLICT (client_id, analytics_type, name) DO NOTHING;
