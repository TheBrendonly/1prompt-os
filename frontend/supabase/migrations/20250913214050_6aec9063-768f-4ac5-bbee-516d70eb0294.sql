-- Fix RLS security issue - enable RLS on chat_histories_1prompt_v_8
ALTER TABLE public.chat_histories_1prompt_v_8 ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for chat_histories_1prompt_v_8 if needed (this appears to be an existing table)
-- Note: This table seems to be from a different feature, but we need RLS enabled for security
CREATE POLICY "Allow all operations on chat_histories_1prompt_v_8" 
ON public.chat_histories_1prompt_v_8 
FOR ALL 
USING (true);