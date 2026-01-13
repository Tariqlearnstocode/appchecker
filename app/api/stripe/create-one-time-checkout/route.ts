import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { stripe } from '@/lib/stripe/client';
import { getOrCreateStripeCustomer } from '@/lib/stripe/helpers';
import { validatePriceIds } from '@/lib/stripe/prices';
import { supabaseAdmin } from '@/utils/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prices = validatePriceIds();

    if (!prices.payAsYouGo) {
      return NextResponse.json(
        { error: 'Pay-as-you-go price not configured' },
        { status: 500 }
      );
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      user.id,
      user.email || ''
    );

    // Create one-time checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [
        {
          price: prices.payAsYouGo,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      success_url: `${request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/?payment=success`,
      cancel_url: `${request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/?payment=canceled`,
      metadata: {
        user_id: user.id,
        type: 'pay_as_you_go',
      },
    });

    // Store pending payment in database
    const { error: insertError } = await supabaseAdmin
      .from('one_time_payments' as any)
      .insert({
        user_id: user.id,
        stripe_checkout_session_id: session.id,
        amount: 1499, // $14.99
        status: 'pending',
      } as any);

    if (insertError) {
      console.error('Error storing payment record:', insertError);
      // Continue anyway - webhook will handle it
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating one-time checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error.message },
      { status: 500 }
    );
  }
}
