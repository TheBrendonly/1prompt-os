-- Add new fields to demo_pages for structured sections
ALTER TABLE demo_pages 
  ADD COLUMN IF NOT EXISTS header_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS intro_title TEXT DEFAULT 'Welcome to Our AI Demo',
  ADD COLUMN IF NOT EXISTS intro_subtitle TEXT DEFAULT 'Experience the capabilities of our AI agents across Voice, Text, and SMS',
  ADD COLUMN IF NOT EXISTS voice_section_title TEXT DEFAULT 'Voice AI Demo',
  ADD COLUMN IF NOT EXISTS voice_section_subtitle TEXT DEFAULT 'Test our AI voice agent in real-time',
  ADD COLUMN IF NOT EXISTS voice_phone_number TEXT,
  ADD COLUMN IF NOT EXISTS voice_phone_country_code TEXT DEFAULT '+1',
  ADD COLUMN IF NOT EXISTS creatives_section_title TEXT DEFAULT 'Ad Creative Previews',
  ADD COLUMN IF NOT EXISTS creatives_section_subtitle TEXT DEFAULT 'Here you can see how your ads on Meta will look like',
  ADD COLUMN IF NOT EXISTS creatives_page_name TEXT,
  ADD COLUMN IF NOT EXISTS creatives_page_logo TEXT,
  ADD COLUMN IF NOT EXISTS chatbot_section_title TEXT DEFAULT 'AI Chatbot Demo',
  ADD COLUMN IF NOT EXISTS chatbot_section_subtitle TEXT DEFAULT 'Here you can test your text AI sales rep';