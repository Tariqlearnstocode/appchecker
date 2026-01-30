-- Add UTM columns for GA4-style attribution in Supabase
ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_campaign text;

-- Update the trigger function to include UTM from auth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, company_name, first_name, last_name, industry, ref, utm_source, utm_medium, utm_campaign)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'industry',
    COALESCE(new.raw_user_meta_data->>'ref', 'organic'),
    new.raw_user_meta_data->>'utm_source',
    new.raw_user_meta_data->>'utm_medium',
    new.raw_user_meta_data->>'utm_campaign'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
