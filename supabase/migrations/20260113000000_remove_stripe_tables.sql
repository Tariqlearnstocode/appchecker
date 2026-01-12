-- Drop Stripe-related tables
-- Run this migration when ready to remove Stripe infrastructure from database

-- Drop tables in order (respecting foreign key constraints)
DROP TABLE IF EXISTS verification_payments CASCADE;
DROP TABLE IF EXISTS credit_transactions CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS prices CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Drop any Stripe-related RPC functions
DROP FUNCTION IF EXISTS use_credit CASCADE;
DROP FUNCTION IF EXISTS grant_credits CASCADE;

-- Keep user_credits table as it may be used for non-Stripe credit system
-- If you want to remove it too, uncomment:
-- DROP TABLE IF EXISTS user_credits CASCADE;
