import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { priceType, verificationId } = body;
    
    // Get or create Stripe customer
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();
    
    let customerId = subscription?.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
      
      // Save customer ID
      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || 'http://localhost:3000';
    
    let sessionParams: Stripe.Checkout.SessionCreateParams;
    
    if (priceType === 'per_report') {
      // One-time payment for a single report
      sessionParams = {
        customer: customerId,
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Income Verification Report',
                description: 'Full 12-month transaction history with PDF export',
              },
              unit_amount: 1000, // $10.00
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}&verification_id=${verificationId}`,
        cancel_url: `${baseUrl}/report/${verificationId}?canceled=true`,
        metadata: {
          user_id: user.id,
          verification_id: verificationId,
          type: 'per_report',
        },
      };
    } else if (priceType === 'pro') {
      // Monthly subscription
      sessionParams = {
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Income Verifier Pro',
                description: 'Up to 100 reports/month, multi-user, custom branding',
              },
              unit_amount: 3499, // $34.99
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/settings?subscription=success`,
        cancel_url: `${baseUrl}/settings?subscription=canceled`,
        metadata: {
          user_id: user.id,
          type: 'pro_subscription',
        },
      };
    } else {
      return NextResponse.json({ error: 'Invalid price type' }, { status: 400 });
    }
    
    const session = await stripe.checkout.sessions.create(sessionParams);
    
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

