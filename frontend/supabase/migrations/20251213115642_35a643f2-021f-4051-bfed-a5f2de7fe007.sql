-- Clean up the old highlevel-setup-X step IDs that were incorrectly saved for GHL credentials
-- These should only be highlevel-credentials-X, not highlevel-setup-X
UPDATE clients 
SET setup_guide_completed_steps = (
  SELECT jsonb_agg(step)
  FROM (
    SELECT step 
    FROM jsonb_array_elements_text(setup_guide_completed_steps::jsonb) AS step
    WHERE step NOT IN ('highlevel-setup-0', 'highlevel-setup-1', 'highlevel-setup-2', 'highlevel-setup-3')
  ) AS filtered_steps
)
WHERE id = '8bc3d20c-e6eb-4004-8a48-6b9c0dd51f6e';