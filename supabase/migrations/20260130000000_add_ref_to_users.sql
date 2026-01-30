-- Add ref column for referral tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS ref text DEFAULT 'organic';

-- Update the trigger function to include ref from auth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, company_name, first_name, last_name, industry, ref)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'industry',
    COALESCE(new.raw_user_meta_data->>'ref', 'organic')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
