-- Update chat_analytics table to support proper caching with composite unique constraint
-- Drop existing constraint if it exists and add proper composite unique constraint
ALTER TABLE public.chat_analytics DROP CONSTRAINT IF EXISTS chat_analytics_client_id_key;
ALTER TABLE public.chat_analytics ADD CONSTRAINT chat_analytics_client_id_time_range_key 
  UNIQUE (client_id, time_range);

-- Add index for better performance on cache lookups
CREATE INDEX IF NOT EXISTS idx_chat_analytics_cache_lookup 
  ON public.chat_analytics (client_id, time_range, last_updated);