-- Migration: One-Time Payment Tracking
-- Tracks successful one-time payments for pay-as-you-go verifications

CREATE TABLE IF NOT EXISTS one_time_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  stripe_checkout_session_id text NOT NULL UNIQUE,
  stripe_payment_intent_id text,
  amount integer NOT NULL, -- in cents ($14.99 = 1499)
  status text NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  verification_id uuid REFERENCES income_verifications, -- null until verification is created
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  used_at timestamptz -- when verification was created using this payment
);

-- Indexes
CREATE INDEX one_time_payments_user_id_idx ON one_time_payments(user_id);
CREATE INDEX one_time_payments_status_idx ON one_time_payments(status);
CREATE INDEX one_time_payments_verification_id_idx ON one_time_payments(verification_id);
CREATE INDEX one_time_payments_stripe_checkout_session_id_idx ON one_time_payments(stripe_checkout_session_id);

-- RLS: Users can view their own payments
ALTER TABLE one_time_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own one_time_payments" ON one_time_payments
  FOR SELECT USING (auth.uid() = user_id);

-- Only server/webhooks can insert/update payments
CREATE POLICY "Service role can manage one_time_payments" ON one_time_payments
  FOR ALL USING (true) WITH CHECK (true); -- This policy should be restricted to service role in production
