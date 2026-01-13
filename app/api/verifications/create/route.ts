import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/utils/supabase/admin';
import {
  getOrCreateStripeCustomer,
  getActiveSubscription,
  reportVerificationUsage,
  getCurrentPeriodUsage,
} from '@/lib/stripe/helpers';
import { stripe } from '@/lib/stripe/client';
import { validatePriceIds } from '@/lib/stripe/prices';

export async function POST(request: NextRequest) {
  try {
    console.log('[ServerAuth] API /verifications/create: Creating Supabase client');
    const supabase = await createClient();
    
    console.log('[ServerAuth] API /verifications/create: Calling getUser()');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('[ServerAuth] API /verifications/create: Auth error:', authError.message, authError);
    }
    
    console.log('[ServerAuth] API /verifications/create: getUser() result - user:', user?.id || 'null', 'email:', user?.email || 'null');

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      individual_name,
      individual_email,
      requested_by_name,
      requested_by_email,
      purpose,
    } = body;

    if (!individual_name || !individual_email) {
      return NextResponse.json(
        { error: 'Individual name and email are required' },
        { status: 400 }
      );
    }

    // Get user's company name if not provided
    const { data: userProfile } = await supabase
      .from('users')
      .select('company_name')
      .eq('id', user.id)
      .single() as { data: { company_name?: string | null } | null };

    const finalRequestedByName =
      requested_by_name ||
      (userProfile?.company_name || null) ||
      'Requesting Party';
    const finalRequestedByEmail = requested_by_email || user.email || null;

    // Check subscription status
    const subscription = await getActiveSubscription(user.id);
    let requiresPayment = false;
    let paymentIntentId: string | null = null;

    if (subscription) {
      // User has active subscription - check usage limit
      try {
        // Get current period usage
        const currentUsage = await getCurrentPeriodUsage(
          user.id,
          subscription.stripe_subscription_id
        );

        // Determine limit based on plan
        const limit = subscription.plan_tier === 'starter' ? 10 : 50;

        // Check if limit is reached
        if (currentUsage >= limit) {
          return NextResponse.json(
            {
              error: 'Verification limit reached',
              limitReached: true,
              currentUsage,
              limit,
              plan: subscription.plan_tier,
              nextPlan: subscription.plan_tier === 'starter' ? 'pro' : 'enterprise',
            },
            { status: 403 }
          );
        }

        // Get Stripe customer ID from subscription (already have it!)
        const customerId = subscription.stripe_customer_id;

        if (!customerId) {
          return NextResponse.json(
            { error: 'Stripe customer not found' },
            { status: 500 }
          );
        }

        // Create verification
        const { data: verification, error: createError } = await supabase
          .from('income_verifications')
          .insert({
            individual_name,
            individual_email,
            requested_by_name: finalRequestedByName,
            requested_by_email: finalRequestedByEmail,
            purpose: purpose || null,
            user_id: user.id,
          } as any)
          .select()
          .single() as { data: { id: string } | null; error: any };

        if (createError) {
          console.error('Error creating verification:', createError);
          return NextResponse.json(
            { error: 'Failed to create verification' },
            { status: 500 }
          );
        }

        if (!verification) {
          return NextResponse.json(
            { error: 'Failed to create verification' },
            { status: 500 }
          );
        }

        // Report usage to Stripe meter for tracking
        try {
          await reportVerificationUsage(
            user.id,
            verification.id,
            customerId
          );
        } catch (usageError) {
          console.error('Error reporting usage:', usageError);
          // Don't fail the verification creation if usage reporting fails
        }

        return NextResponse.json({
          success: true,
          verification,
          message: 'Verification created successfully',
          usage: currentUsage + 1,
          limit,
        });
      } catch (error: any) {
        console.error('Error in subscription flow:', error);
        return NextResponse.json(
          { error: 'Failed to create verification', details: error.message },
          { status: 500 }
        );
      }
    } else {
      // No subscription - pay-as-you-go
      // Check if user has a completed one-time payment ready to use
      const { data: availablePayment } = await supabase
        .from('one_time_payments' as any)
        .select('id, stripe_checkout_session_id')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .is('verification_id', null) // Not yet used
        .order('completed_at', { ascending: false })
        .limit(1)
        .single() as { data: { id: string; stripe_checkout_session_id: string } | null };

      if (!availablePayment) {
        // No payment available - redirect to checkout
        return NextResponse.json(
          {
            error: 'Payment required',
            requiresPayment: true,
            paymentRequired: true,
            message: 'Please complete payment to create a verification.',
          },
          { status: 402 }
        );
      }

      // User has a completed payment - create verification
      const { data: verification, error: createError } = await supabase
        .from('income_verifications')
        .insert({
          individual_name,
          individual_email,
          requested_by_name: finalRequestedByName,
          requested_by_email: finalRequestedByEmail,
          purpose: purpose || null,
          user_id: user.id,
        } as any)
        .select()
        .single() as { data: { id: string } | null; error: any };

      if (createError) {
        console.error('Error creating verification:', createError);
        return NextResponse.json(
          { error: 'Failed to create verification' },
          { status: 500 }
        );
      }

      if (!verification) {
        return NextResponse.json(
          { error: 'Failed to create verification' },
          { status: 500 }
        );
      }

      // Mark payment as used
      const { error: updateError } = await supabaseAdmin
        .from('one_time_payments' as any)
        .update({
          verification_id: verification.id,
          used_at: new Date().toISOString(),
        } as any)
        .eq('id', availablePayment.id);

      if (updateError) {
        console.error('Error updating payment record:', updateError);
        // Don't fail - verification is created
      }

      // Get Stripe customer ID for meter reporting
      const { data: userProfile } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single() as { data: { stripe_customer_id: string | null } | null };

      // Report usage to meter for analytics (even for pay-as-you-go)
      if (userProfile?.stripe_customer_id) {
        try {
          await reportVerificationUsage(
            user.id,
            verification.id,
            userProfile.stripe_customer_id
          );
        } catch (usageError) {
          console.error('Error reporting usage:', usageError);
          // Don't fail - verification is created
        }
      }

      return NextResponse.json({
        success: true,
        verification,
        message: 'Verification created successfully.',
      });
    }
  } catch (error: any) {
    console.error('Error in create verification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
