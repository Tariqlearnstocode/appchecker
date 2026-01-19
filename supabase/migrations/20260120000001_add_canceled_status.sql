-- Migration: Add Canceled Status
-- Adds 'canceled' status to verification_status enum for tracking canceled verifications

-- Add 'canceled' to verification_status enum
-- Note: PostgreSQL doesn't support removing enum values, so 'expired' remains for backward compatibility
ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'canceled';
