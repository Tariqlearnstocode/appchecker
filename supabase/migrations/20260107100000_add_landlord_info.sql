-- Add landlord info and property to income_verifications
-- This ensures applicants can see who's requesting their verification

-- Add landlord information columns to verifications
alter table income_verifications add column if not exists landlord_name text;
alter table income_verifications add column if not exists landlord_email text;
alter table income_verifications add column if not exists property_unit text;

-- Create user_preferences table for storing defaults
-- This allows logged-in users to have their info pre-filled
create table if not exists user_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users unique not null,
  -- Company/landlord info that pre-fills forms
  company_name text,
  email text,
  -- Future: logo_url, phone, etc.
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on user_preferences
alter table user_preferences enable row level security;

-- Users can only view their own preferences
create policy "Users can view own preferences" on user_preferences 
  for select using (auth.uid() = user_id);

-- Users can insert their own preferences
create policy "Users can insert own preferences" on user_preferences 
  for insert with check (auth.uid() = user_id);

-- Users can update their own preferences
create policy "Users can update own preferences" on user_preferences 
  for update using (auth.uid() = user_id);

-- Trigger for updated_at
create trigger update_user_preferences_updated_at
  before update on user_preferences
  for each row execute procedure update_updated_at_column();

-- Index for efficient user lookup
create index if not exists user_preferences_user_id_idx on user_preferences(user_id);

