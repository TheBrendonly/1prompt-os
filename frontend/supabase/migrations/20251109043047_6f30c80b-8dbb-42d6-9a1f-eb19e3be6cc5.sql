-- Create demo_pages table for client demo pages
CREATE TABLE public.demo_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  creatives JSONB NOT NULL DEFAULT '[]'::jsonb,
  cta_text TEXT NOT NULL DEFAULT 'Transform Your Business Today',
  cta_button_text TEXT NOT NULL DEFAULT 'Get Started Now',
  webhook_url TEXT NOT NULL,
  show_chatbot BOOLEAN NOT NULL DEFAULT true,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on slug for fast lookups
CREATE INDEX idx_demo_pages_slug ON public.demo_pages(slug);

-- Create index on client_id
CREATE INDEX idx_demo_pages_client_id ON public.demo_pages(client_id);

-- Enable RLS
ALTER TABLE public.demo_pages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view demo pages for their agency clients
CREATE POLICY "Users can view demo pages for their agency clients"
ON public.demo_pages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM clients
    JOIN profiles ON profiles.agency_id = clients.agency_id
    WHERE profiles.id = auth.uid()
    AND clients.id = demo_pages.client_id
  )
);

-- Policy: Users can create demo pages for their agency clients
CREATE POLICY "Users can create demo pages for their agency clients"
ON public.demo_pages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clients
    JOIN profiles ON profiles.agency_id = clients.agency_id
    WHERE profiles.id = auth.uid()
    AND clients.id = demo_pages.client_id
  )
);

-- Policy: Users can update demo pages for their agency clients
CREATE POLICY "Users can update demo pages for their agency clients"
ON public.demo_pages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM clients
    JOIN profiles ON profiles.agency_id = clients.agency_id
    WHERE profiles.id = auth.uid()
    AND clients.id = demo_pages.client_id
  )
);

-- Policy: Users can delete demo pages for their agency clients
CREATE POLICY "Users can delete demo pages for their agency clients"
ON public.demo_pages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM clients
    JOIN profiles ON profiles.agency_id = clients.agency_id
    WHERE profiles.id = auth.uid()
    AND clients.id = demo_pages.client_id
  )
);

-- Policy: Public can view published demo pages (for the public demo route)
CREATE POLICY "Public can view published demo pages"
ON public.demo_pages
FOR SELECT
USING (is_published = true);

-- Create storage bucket for demo creatives
INSERT INTO storage.buckets (id, name, public)
VALUES ('demo-creatives', 'demo-creatives', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for demo creatives
CREATE POLICY "Public can view demo creatives"
ON storage.objects
FOR SELECT
USING (bucket_id = 'demo-creatives');

CREATE POLICY "Authenticated users can upload demo creatives"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'demo-creatives'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can update their demo creatives"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'demo-creatives'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can delete their demo creatives"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'demo-creatives'
  AND auth.uid() IS NOT NULL
);

-- Trigger to update updated_at
CREATE TRIGGER update_demo_pages_updated_at
BEFORE UPDATE ON public.demo_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();