-- Store Teller webhook events for debugging and auditing
-- Helps track enrollment disconnections and other events

create table if not exists teller_webhook_events (
  id uuid default gen_random_uuid() primary key,
  -- Webhook event details
  event_id text not null unique, -- Teller's event ID
  event_type text not null, -- enrollment.disconnected, transactions.processed, etc.
  -- Enrollment/Account info from webhook
  enrollment_id text,
  account_id text,
  -- Event-specific data (reason for disconnect, status, etc.)
  event_data jsonb not null,
  -- Full event payload for debugging
  full_payload jsonb not null,
  -- Timestamps
  received_at timestamp with time zone default timezone('utc'::text, now()) not null,
  event_timestamp timestamp with time zone, -- From Teller's event.timestamp
  -- Indexes for efficient queries
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for efficient queries
create index if not exists teller_webhook_events_event_type_idx on teller_webhook_events(event_type);
create index if not exists teller_webhook_events_enrollment_id_idx on teller_webhook_events(enrollment_id);
create index if not exists teller_webhook_events_account_id_idx on teller_webhook_events(account_id);
create index if not exists teller_webhook_events_received_at_idx on teller_webhook_events(received_at);
create index if not exists teller_webhook_events_event_id_idx on teller_webhook_events(event_id);

-- Enable RLS (admin-only access for security)
alter table teller_webhook_events enable row level security;

-- Only admins/service role can insert/read webhook events
-- Regular users shouldn't access this data
create policy "Service role can manage webhook events" on teller_webhook_events
  for all using (auth.jwt() ->> 'role' = 'service_role');

comment on table teller_webhook_events is 'Stores Teller webhook events for debugging and auditing enrollment issues';
