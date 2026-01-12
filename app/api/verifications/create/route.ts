import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/utils/supabase/admin';
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
    const { individual_name, individual_email, requested_by_name, requested_by_email, purpose } = body;
    
    if (!individual_name || !individual_email) {
      return NextResponse.json(
        { error: 'Individual name and email are required' },
        { status: 400 }
      );
    }
    
    // Check if user has credits or needs to pay
    const { data: credits } = await supabase
      .from('user_credits')
      .select('credits_remaining, subscription_tier')
      .eq('user_id', user.id)
      .single();
    
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    
    const hasCredits = (credits?.credits_remaining || 0) > 0;
    const isSubscribed = !!subscription;
    const tier = subscription?.tier;
    
    // If no credits, require payment
    if (!hasCredits) {
      // Determine overage amount based on tier
      let amountCents = 1499; // Default to pay-as-you-go
      let message = 'Please pay $14.99 to create this verification.';
      
      if (isSubscribed) {
        if (tier === 'pro') {
          amountCents = 499; // $4.99 for Pro
          message = 'No credits remaining. Please pay $4.99 for this verification.';
        } else {
          amountCents = 899; // $8.99 for Starter
          message = 'No credits remaining. Please pay $8.99 for this verification.';
        }
      }
      
      return NextResponse.json({
        requiresPayment: true,
        amountCents,
        paymentType: isSubscribed ? 'overage' : 'per_verification',
        message,
      }, { status: 402 }); // 402 Payment Required
    }
    
    // Use a credit
    const { data: creditResult, error: creditError } = await supabaseAdmin.rpc('use_credit', {
      target_user_id: user.id,
      verification_id: null, // Will be set after creation
      charge_overage: false,
    });
    
    if (creditError || !creditResult?.success) {
      console.error('Error using credit:', creditError);
      return NextResponse.json(
        { error: 'Failed to process credit', details: creditError?.message },
        { status: 500 }
      );
    }
    
    // Get user's company name if not provided
    const { data: userProfile } = await supabase
      .from('users')
      .select('company_name')
      .eq('id', user.id)
      .single();
    
    const finalRequestedByName = requested_by_name || (userProfile as { company_name?: string | null } | null)?.company_name || user.email || 'Requesting Party';
    const finalRequestedByEmail = requested_by_email || user.email;
    
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
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating verification:', createError);
      // Refund the credit if verification creation failed
      await supabaseAdmin.rpc('grant_credits', {
        target_user_id: user.id,
        credit_amount: 1,
        transaction_type: 'refund',
        description: 'Refund for failed verification creation',
      });
      return NextResponse.json(
        { error: 'Failed to create verification' },
        { status: 500 }
      );
    }
    
    // Update credit transaction with verification_id
    await supabaseAdmin
      .from('credit_transactions')
      .update({ verification_id: verification.id })
      .eq('user_id', user.id)
      .eq('transaction_type', 'use')
      .is('verification_id', null)
      .order('created_at', { ascending: false })
      .limit(1);
    
    // Record payment (for tracking)
    const paymentType = isSubscribed ? 'subscription_credit' : 'one_time';
    await supabaseAdmin
      .from('verification_payments')
      .insert({
        verification_id: verification.id,
        user_id: user.id,
        payment_type: paymentType,
        amount_cents: isSubscribed ? 0 : 1499, // Free for subscription credits
        status: 'succeeded',
        paid_at: new Date().toISOString(),
      });
    
    return NextResponse.json({ 
      success: true, 
      verification,
      message: 'Verification created successfully'
    });
  } catch (error: any) {
    console.error('Error in create verification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
