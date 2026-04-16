-- Add published_sections column to store the live/published version
-- sections will be used for draft, published_sections for what's visible publicly
ALTER TABLE public.demo_pages 
ADD COLUMN IF NOT EXISTS published_sections jsonb DEFAULT '[]'::jsonb;

-- Copy existing sections to published_sections for existing published pages
UPDATE public.demo_pages 
SET published_sections = sections::jsonb 
WHERE is_published = true AND sections IS NOT NULL AND sections != '[]';