import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia', // latest version
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Use admin client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoiceFailed(invoice);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const type = session.metadata?.type;
  const customerId = session.customer as string;

  console.log('[Webhook] Checkout complete:', { userId, type, customerId, sessionId: session.id });

  if (!userId) {
    console.error('[Webhook] No user_id in session metadata');
    return;
  }

  // Save customer ID if not already saved
  if (customerId) {
    await supabaseAdmin
      .from('customers')
      .upsert({
        id: userId,
        stripe_customer_id: customerId,
      });
    console.log('[Webhook] Saved customer ID:', customerId);
  }

  if (type === 'per_verification') {
    // One-time payment - grant 1 credit
    const paymentIntentId = session.payment_intent as string;

    console.log('[Webhook] Granting 1 credit to user:', userId);

    // Grant credit using function
    const { data, error } = await supabaseAdmin.rpc('grant_credits', {
      target_user_id: userId,
      credit_amount: 1,
      transaction_type: 'grant',
      description: 'One-time verification purchase',
      stripe_payment_intent_id: paymentIntentId,
    });

    if (error) {
      console.error('[Webhook] Error granting credits:', error);
    } else {
      console.log('[Webhook] Credits granted successfully:', data);
    }
  } else {
    console.log('[Webhook] Type is not per_verification:', type);
  }

  // Create verification if form data was passed through metadata
  const hasVerificationData = session.metadata?.verification_individual_name && 
                                session.metadata?.verification_individual_email;
  
  if (hasVerificationData) {
    console.log('[Webhook] Creating verification from metadata:', {
      name: session.metadata.verification_individual_name,
      email: session.metadata.verification_individual_email,
    });

    try {
      // Create verification token
      const verificationToken = require('crypto').randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

      const { data: verification, error: verificationError } = await supabaseAdmin
        .from('income_verifications')
        .insert({
          individual_name: session.metadata.verification_individual_name,
          individual_email: session.metadata.verification_individual_email,
          requested_by_name: session.metadata.verification_requested_by_name || null,
          requested_by_email: session.metadata.verification_requested_by_email || null,
          purpose: null,
          user_id: userId,
          verification_token: verificationToken,
          expires_at: expiresAt,
          status: 'pending',
        } as any)
        .select()
        .single();

      if (verificationError) {
        console.error('[Webhook] Error creating verification:', verificationError);
      } else {
        console.log('[Webhook] Successfully created verification:', verification.id);

        // Deduct credit for the verification
        const { error: deductError } = await supabaseAdmin.rpc('use_credit', {
          target_user_id: userId,
          verification_id: verification.id,
        });

        if (deductError) {
          console.error('[Webhook] Error deducting credit:', deductError);
        } else {
          console.log('[Webhook] Successfully deducted credit for verification');
        }
      }
    } catch (error) {
      console.error('[Webhook] Exception creating verification:', error);
    }
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;
  const amount = subscription.items.data[0]?.price.unit_amount || 0;

  // Find user by customer ID
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single() as { data: { user_id: string } | null };

  if (!sub) return;

  // Determine tier and credits based on price
  let tier: 'starter' | 'pro' | 'enterprise' = 'starter';
  let creditsIncluded = 10; // Default to Starter

  if (amount === 19900) {
    tier = 'pro';
    creditsIncluded = 50;
  } else if (amount === 5900) {
    tier = 'starter';
    creditsIncluded = 10;
  }

  const periodStart = new Date(subscription.current_period_start * 1000);
  const periodEnd = new Date(subscription.current_period_end * 1000);

  // Update subscription record
  await supabaseAdmin
    .from('subscriptions')
    .update({
      tier,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      status: subscription.status,
      credits_included: creditsIncluded,
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    } as any)
    .eq('user_id', sub.user_id);

  // Reset credits for new billing period (if subscription is active)
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    await supabaseAdmin.rpc('reset_subscription_credits', {
      target_user_id: sub.user_id,
      credits_included: creditsIncluded,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
    });

    // Update user_credits subscription_tier
    await supabaseAdmin
      .from('user_credits')
      .update({ subscription_tier: tier } as any)
      .eq('user_id', sub.user_id);
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single() as { data: { user_id: string } | null };

  if (!sub) return;

  // Downgrade to free tier
  await supabaseAdmin
    .from('subscriptions')
    .update({
      tier: 'free',
      status: 'canceled',
      stripe_subscription_id: null,
      stripe_price_id: null,
    } as any)
    .eq('user_id', sub.user_id);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Log successful payment for analytics
  console.log('Invoice paid:', invoice.id, 'Amount:', invoice.amount_paid);
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single() as { data: { user_id: string } | null };

  if (!sub) return;

  // Update status to past_due
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'past_due',
    } as any)
    .eq('user_id', sub.user_id);
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const userId = paymentIntent.metadata?.user_id;
  const type = paymentIntent.metadata?.type;
  const verificationId = paymentIntent.metadata?.verification_id;

  if (!userId) return;

  if (type === 'overage') {
    // Overage payment - grant 1 credit
    await supabaseAdmin.rpc('grant_credits', {
      target_user_id: userId,
      credit_amount: 1,
      transaction_type: 'grant',
      description: 'Overage payment for verification',
      stripe_payment_intent_id: paymentIntent.id,
    });

    // Record payment
    if (verificationId) {
      await supabaseAdmin
        .from('verification_payments')
        .insert({
          verification_id: verificationId,
          user_id: userId,
          payment_type: 'overage',
          stripe_payment_intent_id: paymentIntent.id,
          amount_cents: paymentIntent.amount,
          status: 'succeeded',
          paid_at: new Date().toISOString(),
        });
    }
  }
}
