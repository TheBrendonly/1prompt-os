-- Add chat widget code and voice call fields to demo_pages
ALTER TABLE demo_pages 
ADD COLUMN chat_widget_code TEXT,
ADD COLUMN voice_call_enabled BOOLEAN DEFAULT false,
ADD COLUMN voice_agent_id TEXT;