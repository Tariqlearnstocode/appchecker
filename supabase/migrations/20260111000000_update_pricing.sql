-- Update use_credit function with new pricing
-- Pay-as-you-go: $14.99 (1499 cents)
-- Note: Overage pricing is now handled in application code based on tier

CREATE OR REPLACE FUNCTION use_credit(
  target_user_id uuid,
  verification_id uuid,
  charge_overage boolean DEFAULT false
)
RETURNS jsonb AS $$
DECLARE
  current_credits integer;
  user_tier text;
  overage_amount_cents integer := 899; -- Default $8.99 (Starter), Pro handled in app code
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
