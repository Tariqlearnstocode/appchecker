-- Income Verification Requests
-- This table stores verification requests created by landlords for applicants

create type verification_status as enum ('pending', 'in_progress', 'completed', 'expired', 'failed');

create table income_verifications (
  id uuid default gen_random_uuid() primary key,
  -- Session ID for landlords without accounts (stored in localStorage)
  session_id text,
  -- User ID for logged-in landlords
  user_id uuid references auth.users,
  -- Applicant information
  applicant_name text not null,
  applicant_email text not null,
  -- Unique token for the verification link
  verification_token uuid default gen_random_uuid() unique not null,
  -- Status of the verification
  status verification_status default 'pending' not null,
  -- Plaid data (stored after applicant connects)
  plaid_access_token text,
  plaid_item_id text,
  -- Report data (JSON blob with all the income/transaction/balance info)
  report_data jsonb,
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone default (timezone('utc'::text, now()) + interval '7 days') not null,
  completed_at timestamp with time zone,
  -- At least one of session_id or user_id must be set
  constraint session_or_user check (session_id is not null or user_id is not null)
);

-- Indexes for efficient queries
create index income_verifications_session_id_idx on income_verifications(session_id);
create index income_verifications_user_id_idx on income_verifications(user_id);
create index income_verifications_token_idx on income_verifications(verification_token);
create index income_verifications_status_idx on income_verifications(status);

-- Enable RLS
alter table income_verifications enable row level security;

-- Policy for viewing - anyone with session_id or matching user_id can view
create policy "Can view own verifications" on income_verifications 
  for select using (
    auth.uid() = user_id 
    or session_id is not null -- Session-based access handled at application level
  );

-- Policy for inserting - anyone can create a verification
create policy "Can create verifications" on income_verifications 
  for insert with check (true);

-- Policy for updating - same as select
create policy "Can update own verifications" on income_verifications 
  for update using (
    auth.uid() = user_id 
    or session_id is not null
  );

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
create trigger update_income_verifications_updated_at
  before update on income_verifications
  for each row execute procedure update_updated_at_column();

-- Add to realtime
alter publication supabase_realtime add table income_verifications;

