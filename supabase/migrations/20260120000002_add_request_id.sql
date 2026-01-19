-- Migration: Add Request ID for Idempotency
-- Adds request_id field to income_verifications for idempotent verification creation

-- Add request_id column
ALTER TABLE income_verifications 
ADD COLUMN IF NOT EXISTS request_id text;

-- Create unique index on (user_id, request_id) where request_id is not null
-- This allows multiple null request_ids per user (for backward compatibility)
CREATE UNIQUE INDEX IF NOT EXISTS income_verifications_user_request_id_idx 
ON income_verifications(user_id, request_id) 
WHERE request_id IS NOT NULL;
