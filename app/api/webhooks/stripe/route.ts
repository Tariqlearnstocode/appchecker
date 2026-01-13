import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/utils/supabase/admin';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error.message },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  // Get customer ID
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

  // Determine plan tier from price metadata
  const recurringItem = subscription.items.data[0]; // Only recurring price now

  const planTier =
    recurringItem?.price.metadata?.type === 'starter_recurring' ||
    recurringItem?.price.metadata?.type === 'pro_recurring'
      ? recurringItem.price.metadata.type.replace('_recurring', '')
      : subscription.metadata?.plan_tier || 'starter';

  // Save customer ID to users table (ensures we have it even if subscription is deleted)
  const { error: customerError } = await supabaseAdmin
    .from('users')
    .update({ stripe_customer_id: customerId } as any)
    .eq('id', userId);

  if (customerError) {
    console.error('Error saving customer ID:', customerError);
  }

  // Upsert subscription in database
  const { error: upsertError } = await supabaseAdmin.from('stripe_subscriptions' as any).upsert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    stripe_price_id: recurringItem?.price.id || '',
    stripe_usage_price_id: null, // No usage price anymore
    status: subscription.status,
    plan_tier: planTier,
    current_period_start: new Date(
      (subscription as any).current_period_start * 1000
    ).toISOString(),
    current_period_end: new Date(
      (subscription as any).current_period_end * 1000
    ).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  } as any);

  if (upsertError) {
    console.error('Error upserting subscription:', upsertError);
  } else {
    console.log(`Subscription ${subscription.id} updated for user ${userId}`);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  // Update subscription status to canceled
  const { error: updateError } = await supabaseAdmin
    .from('stripe_subscriptions' as any)
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    } as any)
    .eq('stripe_subscription_id', subscription.id);

  if (updateError) {
    console.error('Error updating subscription:', updateError);
  } else {
    console.log(`Subscription ${subscription.id} canceled for user ${userId}`);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Payment succeeded - subscription is active
  // This is handled by subscription.updated event, but we can log it
  console.log(`Payment succeeded for invoice ${invoice.id}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId =
    typeof (invoice as any).subscription === 'string'
      ? (invoice as any).subscription
      : (invoice as any).subscription?.id;

  if (subscriptionId) {
    // Update subscription status to past_due
    const { error: updateError } = await supabaseAdmin
      .from('stripe_subscriptions' as any)
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      } as any)
      .eq('stripe_subscription_id', subscriptionId);

    if (updateError) {
      console.error('Error updating subscription status:', updateError);
    } else {
      console.log(`Payment failed for subscription ${subscriptionId}`);
    }
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  if (!userId) {
    console.error('No user_id in checkout session metadata');
    return;
  }

  // Get customer ID from session
  const customerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id;

  // Save customer ID to users table (if not already saved)
  if (customerId) {
    const { error: customerError } = await supabaseAdmin
      .from('users')
      .update({ stripe_customer_id: customerId } as any)
      .eq('id', userId);

    if (customerError) {
      console.error('Error saving customer ID:', customerError);
    } else {
      console.log(`Customer ${customerId} saved for user ${userId}`);
    }
  }

  // Only handle one-time payments (pay-as-you-go)
  if (session.mode !== 'payment') {
    return; // Subscription payments are handled by subscription webhooks
  }

  // Get payment intent ID if available
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;

  // Update payment record to completed
  const { error: updateError } = await supabaseAdmin
    .from('one_time_payments' as any)
    .update({
      status: 'completed',
      stripe_payment_intent_id: paymentIntentId || null,
      completed_at: new Date().toISOString(),
    } as any)
    .eq('stripe_checkout_session_id', session.id);

  if (updateError) {
    console.error('Error updating one-time payment:', updateError);
  } else {
    console.log(`One-time payment completed for user ${userId}, session ${session.id}`);
  }
}
