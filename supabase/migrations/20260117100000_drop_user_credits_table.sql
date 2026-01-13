-- Drop user_credits table - no longer needed since we're using Stripe for all payments
-- The credit system has been replaced with Stripe subscriptions and one-time payments

DROP TABLE IF EXISTS user_credits CASCADE;

-- Drop related functions if they exist
DROP FUNCTION IF EXISTS grant_credits(uuid, integer) CASCADE;
DROP FUNCTION IF EXISTS use_credit(uuid) CASCADE;
DROP FUNCTION IF EXISTS update_user_credits_updated_at() CASCADE;
