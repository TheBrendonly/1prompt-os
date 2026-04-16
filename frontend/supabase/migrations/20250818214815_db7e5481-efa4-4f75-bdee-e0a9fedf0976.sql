-- Fix the ready leads for immediate processing
UPDATE public.leads 
SET scheduled_for = NOW() - INTERVAL '1 minute'
WHERE id IN (
  SELECT id 
  FROM public.leads 
  WHERE campaign_id = '859de87f-45fb-46c5-bf15-a518ba9140a0' 
    AND status = 'pending' 
  ORDER BY scheduled_for
  LIMIT 12
);