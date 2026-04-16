-- Add sort_order column to clients table for drag-and-drop reordering
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Set initial sort_order based on name (alphabetically) for existing clients
WITH ranked_clients AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY agency_id ORDER BY name) as rn
  FROM public.clients
)
UPDATE public.clients c
SET sort_order = rc.rn
FROM ranked_clients rc
WHERE c.id = rc.id;