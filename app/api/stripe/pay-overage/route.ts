import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

/**
 * Create a payment intent for overage ($8.99)
 * Used when subscription user runs out of credits
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { verification_id } = body;
    
    // Verify user has active subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, stripe_customer_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'Active subscription required for overage billing' },
        { status: 400 }
      );
    }
    
    // Get or create Stripe customer
    let customerId = subscription.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
      
      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
    }
    
    // Determine overage amount based on tier
    const overageAmount = subscription.tier === 'pro' ? 499 : 899; // $4.99 for Pro, $8.99 for Starter
    
    // Create payment intent for overage
    const paymentIntent = await stripe.paymentIntents.create({
      amount: overageAmount,
      currency: 'usd',
      customer: customerId,
      metadata: {
        user_id: user.id,
        verification_id: verification_id || '',
        type: 'overage',
      },
      description: 'Overage charge for income verification',
    });
    
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Error creating overage payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment', details: error.message },
      { status: 500 }
    );
  }
}
