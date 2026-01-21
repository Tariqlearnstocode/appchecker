-- Add first_name, last_name, and industry columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS industry text;

-- Update the trigger function to only include fields we actually use
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, company_name, first_name, last_name, industry)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'industry'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop unused columns: full_name, avatar_url, billing_address, payment_method
ALTER TABLE users DROP COLUMN IF EXISTS full_name;
ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;
ALTER TABLE users DROP COLUMN IF EXISTS billing_address;
ALTER TABLE users DROP COLUMN IF EXISTS payment_method;
