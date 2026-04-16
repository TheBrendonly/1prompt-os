-- Add image_url column to clients table
ALTER TABLE public.clients 
ADD COLUMN image_url text;

-- Create RLS policies for the existing logos bucket
CREATE POLICY "Users can view client logos in their agency"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'logos' 
  AND EXISTS (
    SELECT 1 FROM public.clients c
    JOIN public.profiles p ON p.agency_id = c.agency_id
    WHERE p.id = auth.uid() 
    AND storage.filename(name) LIKE c.id::text || '%'
  )
);

CREATE POLICY "Users can upload client logos for their agency"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'logos' 
  AND EXISTS (
    SELECT 1 FROM public.clients c
    JOIN public.profiles p ON p.agency_id = c.agency_id
    WHERE p.id = auth.uid() 
    AND storage.filename(name) LIKE c.id::text || '%'
  )
);

CREATE POLICY "Users can update client logos for their agency"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'logos' 
  AND EXISTS (
    SELECT 1 FROM public.clients c
    JOIN public.profiles p ON p.agency_id = c.agency_id
    WHERE p.id = auth.uid() 
    AND storage.filename(name) LIKE c.id::text || '%'
  )
);

CREATE POLICY "Users can delete client logos for their agency"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'logos' 
  AND EXISTS (
    SELECT 1 FROM public.clients c
    JOIN public.profiles p ON p.agency_id = c.agency_id
    WHERE p.id = auth.uid() 
    AND storage.filename(name) LIKE c.id::text || '%'
  )
);