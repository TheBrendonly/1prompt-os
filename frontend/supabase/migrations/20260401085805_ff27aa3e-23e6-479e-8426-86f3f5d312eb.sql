CREATE POLICY "service role can insert error_logs"
ON error_logs FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "service role can select error_logs"
ON error_logs FOR SELECT
TO service_role
USING (true);