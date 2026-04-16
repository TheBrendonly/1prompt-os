-- Enable real-time for campaigns table
ALTER TABLE campaigns REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE campaigns;