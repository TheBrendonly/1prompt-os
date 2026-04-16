-- Create public storage bucket for downloadable source files (n8n workflows, Retell agents, SQL schemas)
INSERT INTO storage.buckets (id, name, public)
VALUES ('source-files', 'source-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow anyone to read files in this bucket (downloads are public)
CREATE POLICY "Public read access for source-files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'source-files');

-- Allow authenticated users to upload (used by admins managing files)
CREATE POLICY "Authenticated users can upload source-files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'source-files');

CREATE POLICY "Authenticated users can update source-files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'source-files');

CREATE POLICY "Authenticated users can delete source-files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'source-files');