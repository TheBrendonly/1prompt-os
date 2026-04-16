-- Add color field to custom_metrics table
ALTER TABLE custom_metrics 
ADD COLUMN color text DEFAULT '#3b82f6';

-- Add comment for clarity
COMMENT ON COLUMN custom_metrics.color IS 'Hex color code for metric display (e.g., #3b82f6)';

-- Create table for storing metric color preferences (for default metrics)
CREATE TABLE IF NOT EXISTS metric_color_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  metric_name text NOT NULL,
  color text NOT NULL DEFAULT '#3b82f6',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(client_id, metric_name)
);

-- Enable RLS on metric_color_preferences
ALTER TABLE metric_color_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for metric_color_preferences
CREATE POLICY "Users can view color preferences for their agency clients"
  ON metric_color_preferences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN profiles ON profiles.agency_id = clients.agency_id
      WHERE profiles.id = auth.uid()
      AND clients.id = metric_color_preferences.client_id
    )
  );

CREATE POLICY "Users can create color preferences for their agency clients"
  ON metric_color_preferences FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      JOIN profiles ON profiles.agency_id = clients.agency_id
      WHERE profiles.id = auth.uid()
      AND clients.id = metric_color_preferences.client_id
    )
  );

CREATE POLICY "Users can update color preferences for their agency clients"
  ON metric_color_preferences FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN profiles ON profiles.agency_id = clients.agency_id
      WHERE profiles.id = auth.uid()
      AND clients.id = metric_color_preferences.client_id
    )
  );

CREATE POLICY "Users can delete color preferences for their agency clients"
  ON metric_color_preferences FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN profiles ON profiles.agency_id = clients.agency_id
      WHERE profiles.id = auth.uid()
      AND clients.id = metric_color_preferences.client_id
    )
  );