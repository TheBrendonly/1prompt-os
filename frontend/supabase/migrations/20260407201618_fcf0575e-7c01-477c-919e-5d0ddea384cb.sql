CREATE POLICY "Users can delete their own AI generation jobs"
ON public.ai_generation_jobs
FOR DELETE
TO authenticated
USING (client_id IN (
  SELECT clients.id FROM clients
  WHERE clients.agency_id IN (
    SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid()
  )
));