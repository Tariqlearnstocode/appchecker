-- Stripe Usage-Based Billing Migration
-- Replaces custom credit system with Stripe meters

-- ============================================
-- STRIPE CUSTOMERS TABLE
-- ============================================
-- Maps users to Stripe customers
CREATE TABLE IF NOT EXISTS stripe_customers (
  id uuid PRIMARY KEY REFERENCES auth.users NOT NULL,
  stripe_customer_id text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX stripe_customers_stripe_customer_id_idx ON stripe_customers(stripe_customer_id);

-- RLS
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own stripe customer" ON stripe_customers
  FOR SELECT USING (auth.uid() = id);

-- ============================================
-- STRIPE SUBSCRIPTIONS TABLE
-- ============================================
-- Tracks active subscriptions (Stripe is source of truth, this is for quick lookup)
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  stripe_price_id text NOT NULL, -- Recurring price ID (starter or pro)
  stripe_usage_price_id text, -- Usage price ID for overage billing
  status text NOT NULL, -- active, canceled, past_due, etc.
  plan_tier text CHECK (plan_tier IN ('starter', 'pro')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX stripe_subscriptions_user_id_idx ON stripe_subscriptions(user_id);
CREATE INDEX stripe_subscriptions_stripe_subscription_id_idx ON stripe_subscriptions(stripe_subscription_id);
CREATE INDEX stripe_subscriptions_status_idx ON stripe_subscriptions(status);

-- RLS
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON stripe_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- METER EVENTS TABLE
-- ============================================
-- Audit trail of usage events reported to Stripe
CREATE TABLE IF NOT EXISTS meter_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  verification_id uuid REFERENCES income_verifications NOT NULL,
  stripe_event_id text, -- ID from Stripe if available
  meter_id text, -- Stripe meter ID
  event_name text NOT NULL DEFAULT 'verification.created',
  value integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX meter_events_user_id_idx ON meter_events(user_id);
CREATE INDEX meter_events_verification_id_idx ON meter_events(verification_id);
CREATE INDEX meter_events_created_at_idx ON meter_events(created_at);

-- RLS
ALTER TABLE meter_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own meter events" ON meter_events
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- UPDATE TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_stripe_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stripe_customers_updated_at_trigger
  BEFORE UPDATE ON stripe_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_stripe_customers_updated_at();

CREATE OR REPLACE FUNCTION update_stripe_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stripe_subscriptions_updated_at_trigger
  BEFORE UPDATE ON stripe_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_stripe_subscriptions_updated_at();

-- ============================================
-- NOTES
-- ============================================
-- user_credits table is kept for migration period but is deprecated
-- Credit-related functions (use_credit, grant_credits) are no longer used
-- All billing is now handled by Stripe usage meters
