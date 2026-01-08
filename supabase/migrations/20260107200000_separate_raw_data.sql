-- Separate raw Plaid data from calculated summaries
-- This allows us to re-calculate without losing original data

-- Add column for raw Plaid data (exact API responses)
alter table income_verifications add column if not exists raw_plaid_data jsonb;

-- Rename report_data to calculated_summary (optional caching of calculations)
-- We'll keep report_data for backwards compatibility but use raw_plaid_data going forward
comment on column income_verifications.report_data is 'Deprecated: Use raw_plaid_data instead. This contains mixed raw+calculated data from old verifications.';
comment on column income_verifications.raw_plaid_data is 'Raw Plaid API responses (accounts, transactions). Calculations done at display time.';

