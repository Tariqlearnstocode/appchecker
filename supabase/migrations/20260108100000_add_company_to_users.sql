-- Add company_name to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name text;

-- Update existing users from their metadata (if any have it)
UPDATE users u
SET company_name = (
  SELECT raw_user_meta_data->>'company_name'
  FROM auth.users a
  WHERE a.id = u.id
)
WHERE company_name IS NULL;

-- Update the trigger function to include company_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url, company_name)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'company_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop user_preferences table since we're using the users table now
DROP TABLE IF EXISTS user_preferences;

