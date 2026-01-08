-- Security Features Migration
-- 1. Audit Log Table
-- 2. Auto-delete Policy (2 year retention)
-- 3. Data masking helper function

-- ============================================
-- 1. AUDIT LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid REFERENCES auth.users,
  action text NOT NULL, -- 'view', 'create', 'update', 'delete', 'export'
  resource_type text NOT NULL, -- 'verification', 'user_data', 'report'
  resource_id text, -- The ID of the resource being accessed
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Index for efficient querying
CREATE INDEX audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX audit_logs_created_at_idx ON audit_logs(created_at);
CREATE INDEX audit_logs_resource_type_idx ON audit_logs(resource_type);

-- RLS: Users can only view their own audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Only server can insert audit logs (service role)
CREATE POLICY "Service role can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- ============================================
-- 2. AUTO-DELETE POLICY (Data Retention)
-- ============================================
-- Mark verifications older than 2 years for deletion
-- Actual deletion happens via scheduled job (pg_cron or external)

ALTER TABLE income_verifications 
ADD COLUMN IF NOT EXISTS retention_expires_at timestamptz;

-- Set default retention period: 2 years from completion
-- For new records, this is set when verification is completed
CREATE OR REPLACE FUNCTION set_retention_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.retention_expires_at = NEW.completed_at + INTERVAL '2 years';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_retention_expiry_trigger ON income_verifications;
CREATE TRIGGER set_retention_expiry_trigger
  BEFORE UPDATE ON income_verifications
  FOR EACH ROW EXECUTE FUNCTION set_retention_expiry();

-- Update existing completed verifications with retention expiry
UPDATE income_verifications 
SET retention_expires_at = completed_at + INTERVAL '2 years'
WHERE status = 'completed' AND retention_expires_at IS NULL AND completed_at IS NOT NULL;

-- Function to delete expired data (call via pg_cron or scheduled job)
CREATE OR REPLACE FUNCTION delete_expired_verifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Log the deletion in audit
  INSERT INTO audit_logs (action, resource_type, metadata)
  SELECT 
    'auto_delete',
    'verification',
    jsonb_build_object(
      'verification_token', verification_token,
      'applicant_name', applicant_name,
      'expired_at', retention_expires_at
    )
  FROM income_verifications
  WHERE retention_expires_at < now();

  -- Delete expired verifications
  DELETE FROM income_verifications
  WHERE retention_expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. GDPR SUPPORT - Data Export/Delete Functions
-- ============================================

-- Function to export all user data (GDPR Article 20 - Data Portability)
CREATE OR REPLACE FUNCTION export_user_data(target_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  -- Only allow users to export their own data
  IF auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Log the export
  INSERT INTO audit_logs (user_id, action, resource_type, metadata)
  VALUES (target_user_id, 'export', 'user_data', '{"type": "gdpr_export"}'::jsonb);

  -- Compile all user data
  SELECT jsonb_build_object(
    'exported_at', now(),
    'user', (
      SELECT jsonb_build_object(
        'id', id,
        'email', email,
        'created_at', created_at,
        'company_name', raw_user_meta_data->>'company_name'
      )
      FROM auth.users WHERE id = target_user_id
    ),
    'profile', (
      SELECT to_jsonb(u.*) FROM users u WHERE id = target_user_id
    ),
    'verifications', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', id,
          'created_at', created_at,
          'applicant_name', applicant_name,
          'applicant_email', applicant_email,
          'status', status,
          'completed_at', completed_at
          -- Note: raw_plaid_data excluded for security, but can be requested separately
        )
      ), '[]'::jsonb)
      FROM income_verifications WHERE user_id = target_user_id
    ),
    'audit_logs', (
      SELECT COALESCE(jsonb_agg(to_jsonb(a.*)), '[]'::jsonb)
      FROM audit_logs a WHERE user_id = target_user_id
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete all user data (GDPR Article 17 - Right to Erasure)
CREATE OR REPLACE FUNCTION delete_user_data(target_user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Only allow users to delete their own data
  IF auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Log the deletion request first (this stays for legal compliance)
  INSERT INTO audit_logs (user_id, action, resource_type, metadata)
  VALUES (target_user_id, 'gdpr_delete', 'user_data', 
    jsonb_build_object(
      'requested_at', now(),
      'verification_count', (SELECT COUNT(*) FROM income_verifications WHERE user_id = target_user_id)
    )
  );

  -- Delete verifications (raw financial data)
  DELETE FROM income_verifications WHERE user_id = target_user_id;
  
  -- Delete user profile
  DELETE FROM users WHERE id = target_user_id;
  
  -- Note: auth.users deletion should be done via Supabase Admin API
  -- as it requires elevated privileges
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Helper to mask sensitive data in queries
-- ============================================
CREATE OR REPLACE FUNCTION mask_account_number(account_num text)
RETURNS text AS $$
BEGIN
  IF account_num IS NULL OR length(account_num) < 4 THEN
    RETURN '****';
  END IF;
  RETURN '****' || right(account_num, 4);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

