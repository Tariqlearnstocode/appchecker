-- Allow anonymous users to access verifications via token
-- This is needed for the public /verify/[token] page

CREATE POLICY "Allow public access via verification token" ON income_verifications
  FOR SELECT
  USING (verification_token IS NOT NULL);
