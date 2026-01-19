import { stripe } from './client';
import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/utils/supabase/admin';
import { getMeterId } from './meter';
import Stripe from 'stripe';

/**
 * Get or create a Stripe customer for a user
 * Checks subscription table first, then users table, then creates new customer
 */
export async function getOrCreateStripeCustomer(userId: string, email: string) {
  const supabase = await createClient();

  // First, check if user has a subscription (subscription table is source of truth)
  const { data: subscription, error: subscriptionError } = await supabase
    .from('stripe_subscriptions' as any)
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle() as { data: { stripe_customer_id: string } | null; error: any };

  if (subscription?.stripe_customer_id) {
    // Verify customer still exists in Stripe
    try {
      const customer = await stripe.customers.retrieve(
        subscription.stripe_customer_id
      );
      if (!customer.deleted) {
        return subscription.stripe_customer_id;
      }
    } catch (error) {
      // Customer doesn't exist in Stripe, will create new one below
      console.error('Error retrieving customer from Stripe:', error);
    }
  }

  // Fallback: Check users table for stripe_customer_id (for pay-as-you-go users)
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .maybeSingle() as { data: { stripe_customer_id: string | null } | null; error: any };

  if (userError && userError.code !== 'PGRST116') {
    // PGRST116 is "no rows returned" which is expected, log other errors
    console.error('Error checking users table:', userError);
  }

  if (user?.stripe_customer_id) {
    // Verify customer still exists in Stripe
    try {
      const customer = await stripe.customers.retrieve(
        user.stripe_customer_id
      );
      if (!customer.deleted) {
        console.log(`Found existing Stripe customer ${user.stripe_customer_id} for user ${userId}`);
        return user.stripe_customer_id;
      }
    } catch (error) {
      // Customer doesn't exist in Stripe, create new one
      console.error('Error retrieving customer from Stripe:', error);
    }
  }

  // No existing customer found - create new one
  console.log(`Creating new Stripe customer for user ${userId}`);
  const customer = await stripe.customers.create({
    email,
    metadata: {
      user_id: userId,
    },
  });

  // Store in database (users table)
  // Use admin client to bypass RLS for updating stripe_customer_id
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({ stripe_customer_id: customer.id } as any)
    .eq('id', userId);

  if (updateError) {
    console.error('Error saving customer to database:', updateError);
    throw new Error(`Failed to save Stripe customer to database: ${updateError.message}`);
  } else {
    console.log(`Saved Stripe customer ${customer.id} to database for user ${userId}`);
  }

  return customer.id;
}

/**
 * Get user's active subscription
 */
export async function getActiveSubscription(userId: string) {
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from('stripe_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single() as { data: any };

  return subscription;
}

/**
 * Report verification usage to Stripe meter
 * @deprecated This function is deprecated. Use usage_ledger table instead.
 * Used for tracking/analytics only - limits are enforced in application code
 * Subscriptions have fixed limits (10 for Starter, 50 for Pro) - no overage billing
 */
export async function reportVerificationUsage(
  userId: string,
  verificationId: string,
  customerId: string
) {
  const supabase = await createClient();
  const meterId = await getMeterId();

  try {
    // Report usage to Stripe meter for tracking
    // Use verification_id as identifier to ensure uniqueness per verification
    // This prevents duplicate event errors when multiple verifications are created quickly
    // Value must be in payload per meter configuration (value_settings.event_payload_key: 'value')
    // Stripe requires all payload values to be strings
    // Stripe also requires stripe_customer_id in the payload to identify the customer
    const meterEvent = await stripe.billing.meterEvents.create({
      event_name: 'verification.created',
      identifier: verificationId, // Unique per verification to prevent duplicate errors
      payload: {
        stripe_customer_id: customerId, // Required by Stripe to identify the customer
        verification_id: verificationId,
        user_id: userId,
        value: '1', // Value must be in payload per meter configuration (as string)
      },
    });

    // Store in database for audit
    // Use supabaseAdmin to bypass RLS (server-side operation)
    const { error: insertError } = await supabaseAdmin.from('meter_events' as any).insert({
      user_id: userId,
      verification_id: verificationId,
      stripe_event_id: (meterEvent as any).id || null,
      meter_id: meterId,
      event_name: 'verification.created',
      value: 1,
    } as any);

    if (insertError) {
      console.error('Error storing meter event in database:', insertError);
      // Don't throw - Stripe event was created successfully, DB insert is just for audit
    }

    return meterEvent;
  } catch (error) {
    console.error('Error reporting usage to Stripe:', error);
    throw error;
  }
}

/**
 * Create one-time payment for pay-as-you-go verification
 */
export async function createOneTimePayment(
  customerId: string,
  verificationId: string,
  amount: number
) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: customerId,
      metadata: {
        verification_id: verificationId,
        type: 'pay_as_you_go',
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

/**
 * Get subscription item ID for usage reporting
 * This is needed to report meter events
 */
export async function getSubscriptionItemId(
  subscriptionId: string
): Promise<string | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Find the first subscription item (we no longer use usage-based pricing)
    // This function is kept for backwards compatibility but may not be needed
    const item = subscription.items.data[0];

    return item?.id || null;
  } catch (error) {
    console.error('Error getting subscription item:', error);
    return null;
  }
}

/**
 * Get current period usage count from usage ledger
 * Returns the number of verifications used in the current billing period
 */
export async function getCurrentPeriodUsage(
  userId: string,
  subscriptionId: string
): Promise<number> {
  try {
    const supabase = await createClient();

    // Get subscription period from database (synced from Stripe webhooks)
    const { data: subscription } = await supabase
      .from('stripe_subscriptions' as any)
      .select('current_period_start, current_period_end')
      .eq('stripe_subscription_id', subscriptionId)
      .eq('user_id', userId)
      .single() as { data: { current_period_start: string | null; current_period_end: string | null } | null };

    if (!subscription?.current_period_start || !subscription?.current_period_end) {
      // Fallback: fetch from Stripe API if database doesn't have dates
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
        const periodStartTimestamp = (stripeSubscription as any).current_period_start;
        const periodEndTimestamp = (stripeSubscription as any).current_period_end;

        if (!periodStartTimestamp || !periodEndTimestamp) {
          console.warn('Subscription missing period dates in both DB and Stripe, returning 0 usage');
          return 0;
        }

        const periodStart = new Date(periodStartTimestamp * 1000);
        const periodEnd = new Date(periodEndTimestamp * 1000);

        // Validate dates are valid
        if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
          console.warn('Invalid period dates in subscription, returning 0 usage');
          return 0;
        }

        // Query usage ledger for this period (fallback)
        const { count } = await supabase
          .from('usage_ledger' as any)
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('source', 'subscription')
          .eq('stripe_subscription_id', subscriptionId)
          .eq('period_start', periodStart.toISOString())
          .is('reversed_at', null);

        return count || 0;
      } catch (stripeError) {
        console.error('Error fetching subscription from Stripe:', stripeError);
        return 0;
      }
    }

    // Validate dates are valid
    const periodStart = new Date(subscription.current_period_start);
    const periodEnd = new Date(subscription.current_period_end);

    if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
      console.warn('Invalid period dates in subscription, returning 0 usage');
      return 0;
    }

    // Count active ledger entries for this period (exclude reversed/canceled)
    const { count } = await supabase
      .from('usage_ledger' as any)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('source', 'subscription')
      .eq('stripe_subscription_id', subscriptionId)
      .eq('period_start', subscription.current_period_start)
      .is('reversed_at', null);

    return count || 0;
  } catch (error) {
    console.error('Error getting current period usage:', error);
    // Fallback: return 0 if we can't get usage (allows verification)
    return 0;
  }
}

/**
 * Get subscription usage summary for current period
 * Note: This function may not be used since we're not using usage-based billing
 */
export async function getUsageSummary(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const meterId = await getMeterId();

    // Get usage for current period
    // Note: listUsageRecordSummaries might not be available in current Stripe API version
    // Using type assertion as workaround
    const usageRecords = await (stripe.subscriptionItems as any).listUsageRecordSummaries(
      subscription.items.data[0].id,
      {
        limit: 1,
      }
    );

    return {
      subscription,
      usageRecords: usageRecords?.data || [],
    };
  } catch (error) {
    console.error('Error getting usage summary:', error);
    throw error;
  }
}
