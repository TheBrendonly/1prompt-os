-- Create storage bucket for demo videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('demo-videos', 'demo-videos', true);

-- Add video_url column to demo_pages
ALTER TABLE demo_pages
ADD COLUMN video_url text;

-- RLS policies for demo-videos bucket
CREATE POLICY "Public can view demo videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'demo-videos');

CREATE POLICY "Authenticated users can upload demo videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'demo-videos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own demo videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'demo-videos'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own demo videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'demo-videos'
  AND auth.role() = 'authenticated'
);