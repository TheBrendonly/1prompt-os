CREATE POLICY "Client users can view their own AI generation jobs"
ON public.ai_generation_jobs
FOR SELECT
TO authenticated
USING (client_id = public.get_user_client_id(auth.uid()));