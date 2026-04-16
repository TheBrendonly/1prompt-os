-- Reset stuck leads back to pending status so they can be processed again
UPDATE leads 
SET status = 'pending',
    processed_at = NULL,
    error_message = NULL
WHERE campaign_id = 'ebc5f9ed-b99d-425e-9735-7395b11cda60' 
AND status IN ('locked_for_processing', 'processing');

-- Log the reset action
INSERT INTO execution_logs (
  campaign_id, 
  status, 
  webhook_response,
  error_details
) VALUES (
  'ebc5f9ed-b99d-425e-9735-7395b11cda60',
  'AUDIT_LEADS_RESET',
  json_build_object(
    'action', 'reset_stuck_leads',
    'reset_time', now(),
    'reason', 'leads stuck in processing state'
  )::text,
  'Reset stuck leads from locked_for_processing and processing back to pending'
);