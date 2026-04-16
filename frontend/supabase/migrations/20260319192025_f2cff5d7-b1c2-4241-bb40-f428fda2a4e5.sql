-- This is a one-time data fix, updating subscription status
UPDATE profiles SET subscription_status = 'active', subscription_start_date = now() WHERE email = 'eugene@quimple.agency';
UPDATE clients SET subscription_status = 'active', subscription_start_date = now() WHERE agency_id = (SELECT agency_id FROM profiles WHERE email = 'eugene@quimple.agency');