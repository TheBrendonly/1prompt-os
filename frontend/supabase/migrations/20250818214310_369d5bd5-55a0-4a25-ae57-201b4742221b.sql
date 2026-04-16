-- Trigger immediate processing by updating a few overdue leads to be scheduled for right now
UPDATE public.leads 
SET scheduled_for = NOW()
WHERE campaign_id = 'da1fb736-1826-4ad0-bc17-ab0b1e11cf34' 
  AND status = 'pending' 
  AND scheduled_for < NOW()
LIMIT 12;