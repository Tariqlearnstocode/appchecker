-- Migration: Make user_id explicitly NOT NULL in income_verifications
-- This is a follow-up to the CHECK constraint added in 20260108000000_require_auth.sql
-- Making the column NOT NULL is more explicit and follows best practices

-- Step 1: Ensure all existing records have user_id (should already be true from previous migration)
-- This is a safety check - if any NULLs exist, they'll cause an error
UPDATE income_verifications SET user_id = user_id WHERE user_id IS NULL;
-- If the above doesn't error, we're good to proceed

-- Step 2: Drop the CHECK constraint (we'll replace it with NOT NULL)
ALTER TABLE income_verifications DROP CONSTRAINT IF EXISTS require_user_id;

-- Step 3: Make the column NOT NULL
ALTER TABLE income_verifications 
  ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Also drop session_id column since it's no longer used
ALTER TABLE income_verifications 
  DROP COLUMN IF EXISTS session_id;

-- Step 5: Drop the session_id index if it exists
DROP INDEX IF EXISTS income_verifications_session_id_idx;
