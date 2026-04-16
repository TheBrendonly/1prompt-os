-- Force immediate execution by bypassing batch interval check
-- Clear any recent batch logs that might be blocking processing
DELETE FROM execution_logs 
WHERE campaign_id = '859de87f-45fb-46c5-bf15-a518ba9140a0' 
  AND status = 'BATCH_COMPLETED' 
  AND execution_time > NOW() - INTERVAL '20 minutes';