import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { stripe } from '@/lib/stripe/client';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Stripe customer ID from subscription (if exists) or create one
    let customerId: string | null = null;

    // First, try to get from subscription
    const { data: subscription } = await supabase
      .from('stripe_subscriptions' as any)
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single() as { data: { stripe_customer_id: string } | null };

    if (subscription?.stripe_customer_id) {
      customerId = subscription.stripe_customer_id;
    } else {
      // No subscription - create customer for pay-as-you-go
      const { getOrCreateStripeCustomer } = await import('@/lib/stripe/helpers');
      customerId = await getOrCreateStripeCustomer(user.id, user.email || '');
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 404 }
      );
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/settings?tab=subscription`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session', details: error.message },
      { status: 500 }
    );
  }
}
