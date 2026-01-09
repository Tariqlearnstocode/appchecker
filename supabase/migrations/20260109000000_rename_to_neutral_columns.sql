-- Rename columns to neutral language for income verification product
-- This aligns database schema with product positioning as neutral income verification

-- Rename applicant columns to individual
alter table income_verifications rename column applicant_name to individual_name;
alter table income_verifications rename column applicant_email to individual_email;

-- Rename landlord columns to requested_by
alter table income_verifications rename column landlord_name to requested_by_name;
alter table income_verifications rename column landlord_email to requested_by_email;

-- Rename property_unit to purpose
alter table income_verifications rename column property_unit to purpose;

-- Update functions that reference the old column names
-- These functions were created in 20260108200000_security_features.sql

-- Update auto_delete_expired_verifications function
CREATE OR REPLACE FUNCTION auto_delete_expired_verifications()
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
      'individual_name', individual_name,
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

-- Update export_user_data function
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
          'individual_name', individual_name,
          'individual_email', individual_email,
          'status', status,
          'completed_at', completed_at
          -- Note: raw_plaid_data excluded for security, but can be requested separately
        )
      ), '[]'::jsonb)
      FROM income_verifications
      WHERE user_id = target_user_id
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

