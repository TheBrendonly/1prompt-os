-- Drop the existing problematic storage policies
DROP POLICY IF EXISTS "Users can view client logos in their agency" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload client logos for their agency" ON storage.objects;
DROP POLICY IF EXISTS "Users can update client logos for their agency" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete client logos for their agency" ON storage.objects;

-- Create simplified and more permissive storage policies for the logos bucket
CREATE POLICY "Authenticated users can view logos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can upload logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
);