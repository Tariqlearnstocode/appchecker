import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getActiveSubscription, getCurrentPeriodUsage } from '@/lib/stripe/helpers';
import { stripe } from '@/lib/stripe/client';
import Stripe from 'stripe';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get subscription from database
    const subscription = await getActiveSubscription(user.id);

    if (!subscription) {
      // Pay-as-you-go user - check if they have available payment
      const { data: availablePayment } = await supabase
        .from('one_time_payments' as any)
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .is('verification_id', null)
        .limit(1)
        .single() as { data: { id: string } | null };

      // Get total verifications created (for display)
      const { count: totalVerifications } = await supabase
        .from('income_verifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      return NextResponse.json({
        hasSubscription: false,
        plan: 'pay_as_you_go',
        status: null,
        canCreateVerification: !!availablePayment,
        requiresPayment: !availablePayment,
        paymentAmount: 1499, // $14.99
        totalVerifications: totalVerifications || 0,
        hasAvailablePayment: !!availablePayment,
      });
    }

    // Get detailed subscription info from Stripe
    let stripeSubscription: Stripe.Subscription | null = null;
    let currentUsage = 0;

    try {
      stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id
      );

      // Get current period usage from meter
      const supabase = await createClient();
      currentUsage = await getCurrentPeriodUsage(
        user.id,
        subscription.stripe_subscription_id
      );
    } catch (error) {
      console.error('Error fetching Stripe subscription:', error);
    }

    const limit = subscription.plan_tier === 'starter' ? 10 : 50;
    const canCreateVerification = currentUsage < limit;
    const limitReached = currentUsage >= limit;

    return NextResponse.json({
      hasSubscription: true,
      plan: subscription.plan_tier,
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canCreateVerification,
      limitReached,
      requiresPayment: false,
      limit,
      currentUsage,
      usageInfo: {
        totalUsage: currentUsage,
        periodStart: subscription.current_period_start,
        periodEnd: subscription.current_period_end,
      },
      stripeSubscription: stripeSubscription
        ? {
            id: stripeSubscription.id,
            status: stripeSubscription.status,
            current_period_start: (stripeSubscription as any).current_period_start,
            current_period_end: (stripeSubscription as any).current_period_end,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Error checking subscription status:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
