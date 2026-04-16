-- Add unique constraint for chat_analytics to enable proper upsert persistence
ALTER TABLE public.chat_analytics
ADD CONSTRAINT chat_analytics_client_time_unique 
UNIQUE (client_id, time_range);

-- Add unique constraint for voice_chat_analytics to enable proper upsert persistence
ALTER TABLE public.voice_chat_analytics
ADD CONSTRAINT voice_chat_analytics_client_time_unique 
UNIQUE (client_id, time_range);