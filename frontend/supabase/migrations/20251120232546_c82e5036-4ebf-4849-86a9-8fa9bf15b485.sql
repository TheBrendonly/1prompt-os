-- Create demo-assets storage bucket for demo page uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('demo-assets', 'demo-assets', true);

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload demo assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'demo-assets');

-- Allow authenticated users to update their demo assets
CREATE POLICY "Authenticated users can update demo assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'demo-assets');

-- Allow authenticated users to delete their demo assets
CREATE POLICY "Authenticated users can delete demo assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'demo-assets');

-- Allow public read access to demo assets
CREATE POLICY "Public can view demo assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'demo-assets');