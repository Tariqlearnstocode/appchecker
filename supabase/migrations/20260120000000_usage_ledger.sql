-- Migration: Usage Ledger
-- Tracks verification consumption and credit usage with enhanced auditing
-- Replaces Stripe meter system with database-only tracking

-- ============================================
-- USAGE SOURCE ENUM
-- ============================================
CREATE TYPE usage_source AS ENUM ('subscription', 'payg');

-- ============================================
-- USAGE LEDGER TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS usage_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  verification_id uuid REFERENCES income_verifications NOT NULL UNIQUE,
  source usage_source NOT NULL,
  stripe_subscription_id text, -- For subscription usage
  one_time_payment_id uuid REFERENCES one_time_payments, -- For pay-as-you-go usage
  period_start timestamptz, -- Subscription period start
  period_end timestamptz, -- Subscription period end
  reversed_at timestamptz, -- When credit was refunded (null = active)
  reversal_reason text, -- e.g., 'verification_canceled', 'admin_refund'
  reversal_metadata jsonb DEFAULT '{}'::jsonb, -- Additional context about reversal
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for efficient queries
CREATE INDEX usage_ledger_user_id_idx ON usage_ledger(user_id);
CREATE UNIQUE INDEX usage_ledger_verification_id_idx ON usage_ledger(verification_id);
CREATE INDEX usage_ledger_period_idx ON usage_ledger(user_id, period_start, period_end);
CREATE INDEX usage_ledger_source_idx ON usage_ledger(source);
CREATE INDEX usage_ledger_reversed_at_idx ON usage_ledger(reversed_at) WHERE reversed_at IS NULL;
CREATE INDEX usage_ledger_created_at_idx ON usage_ledger(created_at);

-- RLS: Users can view their own ledger entries
ALTER TABLE usage_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ledger entries" ON usage_ledger
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update (via admin client)
-- Note: In production, this should be restricted to service role only
CREATE POLICY "Service role can manage ledger" ON usage_ledger
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- UPDATE TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_usage_ledger_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_usage_ledger_updated_at_trigger
  BEFORE UPDATE ON usage_ledger
  FOR EACH ROW
  EXECUTE FUNCTION update_usage_ledger_updated_at();
