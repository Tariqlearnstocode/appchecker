import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/utils/supabase/admin';
import {
  getActiveSubscription,
  getCurrentPeriodUsage,
} from '@/lib/stripe/helpers';
import { sanitizeName, sanitizeEmail, sanitizePurpose, sanitizeCompanyName } from '@/utils/sanitize';
import { logAudit, getRequestContext } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('API /verifications/create: Auth error:', authError.message, authError);
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      individual_name: raw_individual_name,
      individual_email: raw_individual_email,
      requested_by_name: raw_requested_by_name,
      requested_by_email: raw_requested_by_email,
      purpose: raw_purpose,
    } = body;

    // Sanitize all inputs
    const individual_name = sanitizeName(raw_individual_name);
    const individual_email = sanitizeEmail(raw_individual_email);
    const requested_by_name = raw_requested_by_name ? sanitizeName(raw_requested_by_name) : null;
    const requested_by_email = raw_requested_by_email ? sanitizeEmail(raw_requested_by_email) : null;
    const purpose = raw_purpose ? sanitizePurpose(raw_purpose) : null;

    if (!individual_name || !individual_email) {
      return NextResponse.json(
        { error: 'Individual name and email are required' },
        { status: 400 }
      );
    }

    // Validate email format after sanitization
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(individual_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Note: request_id idempotency feature removed

    // Get user's company name if not provided
    const { data: userProfile } = await supabase
      .from('users')
      .select('company_name')
      .eq('id', user.id)
      .single() as { data: { company_name?: string | null } | null };

    const finalRequestedByName =
      requested_by_name ||
      (userProfile?.company_name ? sanitizeCompanyName(userProfile.company_name) : null) ||
      'Requesting Party';
    const finalRequestedByEmail = requested_by_email || (user.email ? sanitizeEmail(user.email) : null);

    // Get request context for audit logging
    const { ipAddress, userAgent } = getRequestContext(request);

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

        // Create verification with ledger entry
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

        // Insert into usage ledger
        const { error: ledgerError } = await supabaseAdmin
          .from('usage_ledger' as any)
          .insert({
            user_id: user.id,
            verification_id: verification.id,
            source: 'subscription',
            stripe_subscription_id: subscription.stripe_subscription_id,
            period_start: subscription.current_period_start,
            period_end: subscription.current_period_end,
          } as any);

        if (ledgerError) {
          console.error('Error inserting into usage ledger:', ledgerError);
          // Log but don't fail - verification is created
        }

        // Log to audit logs
        await logAudit({
          action: 'create',
          resourceType: 'verification',
          resourceId: verification.id,
          metadata: {
            verification_id: verification.id,
            source: 'subscription',
            subscription_id: subscription.stripe_subscription_id,
            plan_tier: subscription.plan_tier,
            period_start: subscription.current_period_start,
            period_end: subscription.current_period_end,
            usage_after: currentUsage + 1,
            limit,
          },
          ipAddress,
          userAgent,
        });

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
      // Find available payment with row-level lock to prevent race conditions
      const { data: availablePayment } = await supabaseAdmin
        .from('one_time_payments' as any)
        .select('id, amount, stripe_checkout_session_id')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .is('verification_id', null) // Not yet used
        .order('completed_at', { ascending: true })
        .limit(1)
        .single() as { data: { id: string; amount: number; stripe_checkout_session_id: string } | null };

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

      // User has a completed payment - create verification with ledger entry
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

      // Insert into usage ledger
      const { error: ledgerError } = await supabaseAdmin
        .from('usage_ledger' as any)
        .insert({
          user_id: user.id,
          verification_id: verification.id,
          source: 'payg',
          one_time_payment_id: availablePayment.id,
        } as any);

      if (ledgerError) {
        console.error('Error inserting into usage ledger:', ledgerError);
        // Log but don't fail - verification is created
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

      // Log to audit logs
      await logAudit({
        action: 'create',
        resourceType: 'verification',
        resourceId: verification.id,
        metadata: {
          verification_id: verification.id,
          source: 'payg',
          payment_id: availablePayment.id,
          payment_amount_cents: availablePayment.amount,
        },
        ipAddress,
        userAgent,
      });

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
