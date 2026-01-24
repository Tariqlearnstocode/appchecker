-- Remove unused columns from income_verifications table
-- These columns are no longer needed:
-- - report_data: Replaced by raw_plaid_data (deprecated)
-- - last_reminder_sent_at: Reminder functionality removed
-- - reminder_count: Reminder functionality removed  
-- - request_id: Idempotency feature removed

-- Drop the unique index on request_id first (if it exists)
DROP INDEX IF EXISTS income_verifications_user_request_id_idx;

-- Remove columns
ALTER TABLE income_verifications 
  DROP COLUMN IF EXISTS report_data,
  DROP COLUMN IF EXISTS last_reminder_sent_at,
  DROP COLUMN IF EXISTS reminder_count,
  DROP COLUMN IF EXISTS request_id;
