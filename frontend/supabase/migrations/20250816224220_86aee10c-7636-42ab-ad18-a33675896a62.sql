
-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Add user_id to campaigns table to link campaigns to users
ALTER TABLE public.campaigns ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update campaigns RLS policies to be user-specific
DROP POLICY IF EXISTS "Allow public read access to campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Allow public insert access to campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Allow public update access to campaigns" ON public.campaigns;

CREATE POLICY "Users can view own campaigns" ON public.campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns" ON public.campaigns
  FOR UPDATE USING (auth.uid() = user_id);

-- Update leads RLS policies to be user-specific through campaigns
DROP POLICY IF EXISTS "Allow public read access to leads" ON public.leads;
DROP POLICY IF EXISTS "Allow public insert access to leads" ON public.leads;
DROP POLICY IF EXISTS "Allow public update access to leads" ON public.leads;

CREATE POLICY "Users can view leads from own campaigns" ON public.leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = leads.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create leads for own campaigns" ON public.leads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = leads.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update leads from own campaigns" ON public.leads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = leads.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Update campaign_schedules RLS policies
DROP POLICY IF EXISTS "Allow public read access to campaign_schedules" ON public.campaign_schedules;
DROP POLICY IF EXISTS "Allow public insert access to campaign_schedules" ON public.campaign_schedules;
DROP POLICY IF EXISTS "Allow public update access to campaign_schedules" ON public.campaign_schedules;

CREATE POLICY "Users can view schedules for own campaigns" ON public.campaign_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = campaign_schedules.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create schedules for own campaigns" ON public.campaign_schedules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = campaign_schedules.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update schedules for own campaigns" ON public.campaign_schedules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = campaign_schedules.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Update execution_logs RLS policies
DROP POLICY IF EXISTS "Allow public read access to execution_logs" ON public.execution_logs;
DROP POLICY IF EXISTS "Allow public insert access to execution_logs" ON public.execution_logs;

CREATE POLICY "Users can view logs from own campaigns" ON public.execution_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = execution_logs.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create logs for own campaigns" ON public.execution_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = execution_logs.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
