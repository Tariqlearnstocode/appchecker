import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { priceType, amountCents, verificationData } = body;
    
    // Get or create Stripe customer
    // First check customers table
    const { data: customerRecord } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single() as { data: { stripe_customer_id: string | null } | null };
    
    let customerId = customerRecord?.stripe_customer_id;
    
    // If not in customers table, check subscriptions
    if (!customerId) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .single() as { data: { stripe_customer_id: string | null } | null };
      
      customerId = subscription?.stripe_customer_id;
    }
    
    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
      
      // Save customer ID in customers table
      await supabase
        .from('customers')
        .upsert({
          id: user.id,
          stripe_customer_id: customerId,
        } as any);
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || 'http://localhost:3000';
    
    let sessionParams: Stripe.Checkout.SessionCreateParams;
    
    if (priceType === 'per_verification') {
      // One-time payment for a single verification ($14.99)
      sessionParams = {
        customer: customerId,
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Income Verification',
                description: 'One-time income verification credit',
              },
              unit_amount: 1499, // $14.99
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}?payment=canceled`,
        metadata: {
          user_id: user.id,
          type: 'per_verification',
          ...(verificationData && {
            verification_individual_name: verificationData.individual_name || '',
            verification_individual_email: verificationData.individual_email || '',
            verification_requested_by_name: verificationData.requested_by_name || '',
            verification_requested_by_email: verificationData.requested_by_email || '',
          }),
        },
      };
    } else if (priceType === 'starter') {
      // Starter subscription ($59/mo, 10 credits)
      sessionParams = {
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Income Verifier Starter',
                description: '10 verifications/month, $8.99 overage',
              },
              unit_amount: 5900, // $59.00
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
          type: 'starter_subscription',
        },
      };
    } else if (priceType === 'pro') {
      // Pro subscription ($199/mo, 50 credits)
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
                description: '50 verifications/month, $4.99 overage',
              },
              unit_amount: 19900, // $199.00
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
    } else if (priceType === 'overage') {
      // Overage payment for subscription users (dynamic amount based on tier)
      const overageAmount = amountCents || 899; // Default to $8.99 if not provided
      sessionParams = {
        customer: customerId,
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Income Verification Overage',
                description: 'Additional verification beyond subscription limit',
              },
              unit_amount: overageAmount,
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}?payment=canceled`,
        metadata: {
          user_id: user.id,
          type: 'overage',
          ...(verificationData && {
            verification_individual_name: verificationData.individual_name || '',
            verification_individual_email: verificationData.individual_email || '',
            verification_requested_by_name: verificationData.requested_by_name || '',
            verification_requested_by_email: verificationData.requested_by_email || '',
          }),
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

