-- Add sections column to demo_pages for storing canvas state
ALTER TABLE demo_pages ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '[]'::jsonb;

-- Add title column for backward compatibility
ALTER TABLE demo_pages ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Untitled Demo Page'::text;