
CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,

  -- External IDs
  unipile_account_id text NOT NULL,
  unipile_event_id text NOT NULL,
  provider text NOT NULL DEFAULT 'GOOGLE',
  calendar_id text,
  external_event_id text,
  ical_uid text,
  etag text,
  master_event_id text,
  recurring_event_id text,
  sequence integer DEFAULT 0,

  -- Core event data
  title text,
  description text,
  location text,
  status text DEFAULT 'confirmed',
  
  -- Time fields
  start_datetime timestamptz,
  start_date date,
  start_timezone text,
  end_datetime timestamptz,
  end_date date,
  end_timezone text,
  original_start_datetime timestamptz,
  original_start_timezone text,
  is_all_day boolean DEFAULT false,
  
  -- Display & visibility
  color_id text,
  color_hex text,
  transparency text DEFAULT 'opaque',
  visibility text DEFAULT 'default',
  sensitivity text,
  importance text DEFAULT 'normal',
  show_as text,
  
  -- Organizer & creator
  organizer_email text,
  organizer_name text,
  organizer_is_self boolean DEFAULT false,
  creator_email text,
  creator_name text,
  is_organizer boolean DEFAULT false,
  response_status text,

  -- Boolean flags
  is_cancelled boolean DEFAULT false,
  is_attendees_list_hidden boolean DEFAULT false,
  is_online_meeting boolean DEFAULT false,
  is_reminder_on boolean DEFAULT true,
  has_attachments boolean DEFAULT false,
  attendees_omitted boolean DEFAULT false,
  end_time_unspecified boolean DEFAULT false,
  anyone_can_add_self boolean DEFAULT false,
  guests_can_invite_others boolean DEFAULT true,
  guests_can_modify boolean DEFAULT false,
  guests_can_see_other_guests boolean DEFAULT true,
  is_locked boolean DEFAULT false,
  is_private_copy boolean DEFAULT false,

  -- Reminders
  reminder_minutes integer,
  reminders jsonb DEFAULT '[]'::jsonb,

  -- Attendees (array of objects with email, name, response, etc.)
  attendees jsonb DEFAULT '[]'::jsonb,

  -- Recurrence rules (RRULE strings or pattern objects)
  recurrence jsonb,

  -- Conference / online meeting
  conference_data jsonb,
  hangout_link text,
  online_meeting_url text,
  online_meeting_provider text,

  -- Links
  html_link text,
  web_link text,

  -- Attachments
  attachments jsonb DEFAULT '[]'::jsonb,

  -- Extended / custom properties
  extended_properties jsonb DEFAULT '{}'::jsonb,
  categories jsonb DEFAULT '[]'::jsonb,

  -- Provider-specific catch-all
  provider_metadata jsonb DEFAULT '{}'::jsonb,

  -- Provider timestamps
  provider_created_at timestamptz,
  provider_updated_at timestamptz,

  -- Our timestamps
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Unique constraint: one Unipile event per client
  UNIQUE(client_id, unipile_event_id)
);

-- Index for fast lookups
CREATE INDEX idx_calendar_events_client_id ON public.calendar_events(client_id);
CREATE INDEX idx_calendar_events_unipile_account ON public.calendar_events(unipile_account_id);
CREATE INDEX idx_calendar_events_start ON public.calendar_events(start_datetime);
CREATE INDEX idx_calendar_events_calendar ON public.calendar_events(calendar_id);
CREATE INDEX idx_calendar_events_contact ON public.calendar_events(contact_id);

-- Updated_at trigger
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage calendar events for their clients"
  ON public.calendar_events
  FOR ALL
  TO authenticated
  USING (
    client_id IN (
      SELECT c.id FROM public.clients c
      WHERE c.agency_id IN (
        SELECT p.agency_id FROM public.profiles p WHERE p.id = auth.uid()
      )
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT c.id FROM public.clients c
      WHERE c.agency_id IN (
        SELECT p.agency_id FROM public.profiles p WHERE p.id = auth.uid()
      )
    )
  );
