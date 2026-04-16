-- Fix the UPDATE syntax - use subquery to limit results
UPDATE public.leads 
SET scheduled_for = NOW()
WHERE id IN (
  SELECT id 
  FROM public.leads 
  WHERE campaign_id = 'da1fb736-1826-4ad0-bc17-ab0b1e11cf34' 
    AND status = 'pending' 
    AND scheduled_for < NOW()
  ORDER BY scheduled_for
  LIMIT 12
);