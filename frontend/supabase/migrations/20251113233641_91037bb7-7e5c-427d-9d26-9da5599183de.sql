-- Add sections and title columns to demo_pages table
ALTER TABLE demo_pages 
ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Untitled Demo Page';