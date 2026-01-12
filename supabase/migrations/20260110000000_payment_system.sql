-- Payment System Migration
-- Implements credit-based system for subscriptions and one-time payments

-- ============================================
-- USER CREDITS TABLE
-- ============================================
-- Tracks credit balance and usage for each user
CREATE TABLE IF NOT EXISTS user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  -- Current credit balance
  credits_remaining integer DEFAULT 0 NOT NULL,
  -- Credits used in current billing period
  credits_used_this_period integer DEFAULT 0 NOT NULL,
  -- Billing period tracking (for subscriptions)
  period_start timestamp with time zone,
  period_end timestamp with time zone,
  -- Subscription tier (null = pay-as-you-go)
  subscription_tier text CHECK (subscription_tier IN ('starter', 'pro', 'enterprise')) DEFAULT NULL,
  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX user_credits_user_id_idx ON user_credits(user_id);
CREATE INDEX user_credits_period_end_idx ON user_credits(period_end);

-- RLS
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- CREDIT TRANSACTIONS TABLE
-- ============================================
-- Audit log of all credit grants and usage
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  -- Transaction type
  transaction_type text NOT NULL CHECK (transaction_type IN ('grant', 'use', 'expire', 'refund')),
  -- Amount of credits (positive for grant, negative for use/expire)
  amount integer NOT NULL,
  -- Related verification (if applicable)
  verification_id uuid REFERENCES income_verifications,
  -- Stripe payment intent (if from payment)
  stripe_payment_intent_id text,
  -- Description
  description text,
  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX credit_transactions_user_id_idx ON credit_transactions(user_id);
CREATE INDEX credit_transactions_verification_id_idx ON credit_transactions(verification_id);
CREATE INDEX credit_transactions_created_at_idx ON credit_transactions(created_at);

-- RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- VERIFICATION PAYMENTS TABLE
-- ============================================
-- Links verifications to payments (for tracking and refunds)
CREATE TABLE IF NOT EXISTS verification_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid REFERENCES income_verifications NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users NOT NULL,
  -- Payment type
  payment_type text NOT NULL CHECK (payment_type IN ('one_time', 'subscription_credit', 'overage')),
  -- Stripe payment intent ID
  stripe_payment_intent_id text,
  -- Amount in cents
  amount_cents integer NOT NULL,
  -- Currency
  currency text DEFAULT 'usd',
  -- Payment status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  paid_at timestamp with time zone
);

CREATE INDEX verification_payments_verification_id_idx ON verification_payments(verification_id);
CREATE INDEX verification_payments_user_id_idx ON verification_payments(user_id);
CREATE INDEX verification_payments_stripe_payment_intent_id_idx ON verification_payments(stripe_payment_intent_id);

-- RLS
ALTER TABLE verification_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payments" ON verification_payments
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- UPDATE SUBSCRIPTIONS TABLE
-- ============================================
-- Add missing fields to subscriptions table
ALTER TABLE subscriptions 
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS tier text CHECK (tier IN ('starter', 'pro', 'enterprise')),
  ADD COLUMN IF NOT EXISTS credits_included integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credits_used_this_period integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to grant credits to a user
CREATE OR REPLACE FUNCTION grant_credits(
  target_user_id uuid,
  credit_amount integer,
  transaction_type text,
  description text DEFAULT NULL,
  stripe_payment_intent_id text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Insert transaction record
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    amount,
    stripe_payment_intent_id,
    description
  ) VALUES (
    target_user_id,
    transaction_type,
    credit_amount,
    stripe_payment_intent_id,
    description
  );
  
  -- Update or insert user credits
  INSERT INTO user_credits (user_id, credits_remaining)
  VALUES (target_user_id, credit_amount)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    credits_remaining = user_credits.credits_remaining + credit_amount,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use a credit (with overage handling)
CREATE OR REPLACE FUNCTION use_credit(
  target_user_id uuid,
  verification_id uuid,
  charge_overage boolean DEFAULT false
)
RETURNS jsonb AS $$
DECLARE
  current_credits integer;
  user_tier text;
  overage_amount_cents integer := 899; -- $8.99 in cents
  result jsonb;
BEGIN
  -- Get current credits and tier
  SELECT credits_remaining, subscription_tier
  INTO current_credits, user_tier
  FROM user_credits
  WHERE user_id = target_user_id;
  
  -- If no credits record exists, create one
  IF current_credits IS NULL THEN
    INSERT INTO user_credits (user_id, credits_remaining)
    VALUES (target_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;
    current_credits := 0;
  END IF;
  
  -- Check if user has credits
  IF current_credits > 0 THEN
    -- Use a credit
    UPDATE user_credits
    SET 
      credits_remaining = credits_remaining - 1,
      credits_used_this_period = credits_used_this_period + 1,
      updated_at = now()
    WHERE user_id = target_user_id;
    
    -- Log transaction
    INSERT INTO credit_transactions (
      user_id,
      transaction_type,
      amount,
      verification_id,
      description
    ) VALUES (
      target_user_id,
      'use',
      -1,
      verification_id,
      'Credit used for verification'
    );
    
    result := jsonb_build_object(
      'success', true,
      'used_credit', true,
      'credits_remaining', current_credits - 1,
      'requires_payment', false
    );
  ELSE
    -- No credits - requires payment
    result := jsonb_build_object(
      'success', false,
      'used_credit', false,
      'credits_remaining', 0,
      'requires_payment', true,
      'amount_cents', CASE 
        WHEN charge_overage AND user_tier IS NOT NULL THEN overage_amount_cents
        ELSE 1499 -- $14.99 for pay-as-you-go
      END
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset credits for subscription renewal
CREATE OR REPLACE FUNCTION reset_subscription_credits(
  target_user_id uuid,
  credits_included integer,
  period_start timestamp with time zone,
  period_end timestamp with time zone
)
RETURNS void AS $$
BEGIN
  -- Update user credits
  UPDATE user_credits
  SET 
    credits_remaining = credits_included,
    credits_used_this_period = 0,
    period_start = reset_subscription_credits.period_start,
    period_end = reset_subscription_credits.period_end,
    updated_at = now()
  WHERE user_id = target_user_id;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_credits (
      user_id,
      credits_remaining,
      credits_used_this_period,
      period_start,
      period_end
    ) VALUES (
      target_user_id,
      credits_included,
      0,
      reset_subscription_credits.period_start,
      reset_subscription_credits.period_end
    );
  END IF;
  
  -- Log the grant
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    amount,
    description
  ) VALUES (
    target_user_id,
    'grant',
    credits_included,
    'Monthly subscription credits reset'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_credits_updated_at_trigger ON user_credits;
CREATE TRIGGER update_user_credits_updated_at_trigger
  BEFORE UPDATE ON user_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_user_credits_updated_at();
