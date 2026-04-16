ALTER TABLE public.engagement_executions
  ADD COLUMN IF NOT EXISTS last_completed_node_index integer DEFAULT -1;