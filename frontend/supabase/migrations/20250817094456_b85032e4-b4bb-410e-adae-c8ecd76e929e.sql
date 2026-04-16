-- Enable real-time for leads table
ALTER TABLE leads REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE leads;