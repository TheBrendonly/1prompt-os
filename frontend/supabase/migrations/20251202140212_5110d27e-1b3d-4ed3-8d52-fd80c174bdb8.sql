-- Drop the restrictive public policy
DROP POLICY IF EXISTS "Public can view published demo pages" ON demo_pages;

-- Create a PERMISSIVE policy for public access to published demo pages
CREATE POLICY "Public can view published demo pages"
ON demo_pages
FOR SELECT
TO anon, authenticated
USING (is_published = true);