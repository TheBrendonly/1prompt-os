-- Create storage bucket for user logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', true);

-- Create storage policies for logo uploads
CREATE POLICY "Users can view all logos"
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'logos');

CREATE POLICY "Users can upload their own logo"
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own logo"
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own logo"
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add logo_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN logo_url TEXT;