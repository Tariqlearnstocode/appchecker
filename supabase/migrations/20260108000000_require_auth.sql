-- Migration: Require authentication for verifications
-- Remove session_id support and require user_id

-- Step 1: Delete old session-based verifications (no user_id)
-- These are anonymous verifications that can't be migrated
DELETE FROM income_verifications WHERE user_id IS NULL;

-- Step 2: Drop old policies
DROP POLICY IF EXISTS "Can view own verifications" ON income_verifications;
DROP POLICY IF EXISTS "Can create verifications" ON income_verifications;
DROP POLICY IF EXISTS "Can update own verifications" ON income_verifications;

-- Step 3: Remove the session_or_user constraint (we now require user_id)
ALTER TABLE income_verifications DROP CONSTRAINT IF EXISTS session_or_user;

-- Step 4: Add constraint requiring user_id
ALTER TABLE income_verifications 
  ADD CONSTRAINT require_user_id CHECK (user_id IS NOT NULL);

-- Step 5: New strict RLS policies

-- Only authenticated users can view their own verifications
CREATE POLICY "Users can view own verifications" ON income_verifications 
  FOR SELECT USING (auth.uid() = user_id);

-- Only authenticated users can create verifications (linked to their account)
CREATE POLICY "Users can create verifications" ON income_verifications 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only authenticated users can update their own verifications
CREATE POLICY "Users can update own verifications" ON income_verifications 
  FOR UPDATE USING (auth.uid() = user_id);

-- Only authenticated users can delete their own verifications
CREATE POLICY "Users can delete own verifications" ON income_verifications 
  FOR DELETE USING (auth.uid() = user_id);

-- Note: The verification_token is still used for applicants to access their verification link
-- Report viewing is handled at application level with token-based access

