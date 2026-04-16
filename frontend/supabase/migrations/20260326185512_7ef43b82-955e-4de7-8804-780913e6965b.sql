
-- Rename slot_id from agent-{N} to Setter-{N} across all tables
-- This covers agent-1 through agent-10 and agent-followup

-- 1. prompts table
UPDATE public.prompts 
SET slot_id = 'Setter-' || substring(slot_id from 'agent-(.+)')
WHERE slot_id LIKE 'agent-%';

-- 2. prompt_configurations table (includes compound keys like agent-1__param__...)
UPDATE public.prompt_configurations 
SET slot_id = regexp_replace(slot_id, '^agent-', 'Setter-')
WHERE slot_id LIKE 'agent-%';

-- 3. prompt_versions table (includes compound keys like agent-1__param__...)
UPDATE public.prompt_versions 
SET slot_id = regexp_replace(slot_id, '^agent-', 'Setter-')
WHERE slot_id LIKE 'agent-%';

-- 4. agent_settings table
UPDATE public.agent_settings 
SET slot_id = 'Setter-' || substring(slot_id from 'agent-(.+)')
WHERE slot_id LIKE 'agent-%';

-- 5. prompt_chat_threads title (prompt-ai-agent-X -> prompt-ai-Setter-X)
UPDATE public.prompt_chat_threads 
SET title = regexp_replace(title, 'prompt-ai-agent-', 'prompt-ai-Setter-')
WHERE title LIKE 'prompt-ai-agent-%';
