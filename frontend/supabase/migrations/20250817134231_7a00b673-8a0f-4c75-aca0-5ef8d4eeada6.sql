-- Create separate agencies for existing users and update their profiles
DO $$
DECLARE
  user_record RECORD;
  new_agency_id uuid;
BEGIN
  -- Loop through each existing user
  FOR user_record IN 
    SELECT id, email, full_name 
    FROM profiles 
    WHERE agency_id = '00000000-0000-0000-0000-000000000001'
  LOOP
    -- Create a new agency for this user
    INSERT INTO agencies (name, email)
    VALUES (
      COALESCE(user_record.full_name, user_record.email) || '''s Agency',
      user_record.email
    )
    RETURNING id INTO new_agency_id;
    
    -- Update the user's profile to link to their new agency
    UPDATE profiles 
    SET agency_id = new_agency_id
    WHERE id = user_record.id;
    
    -- Update any existing clients to belong to this user's new agency
    UPDATE clients 
    SET agency_id = new_agency_id
    WHERE agency_id = '00000000-0000-0000-0000-000000000001'
    AND EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.client_id = clients.id 
      AND campaigns.user_id = user_record.id
    );
    
  END LOOP;
END $$;