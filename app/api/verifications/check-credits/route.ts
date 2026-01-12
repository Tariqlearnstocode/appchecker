import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/utils/supabase/admin';

/**
 * Check if user has credits or needs to pay
 * Returns credit status and payment requirements
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user's credit balance
    const { data: credits } = await supabase
      .from('user_credits')
      .select('credits_remaining, subscription_tier')
      .eq('user_id', user.id)
      .single() as { data: { credits_remaining: number; subscription_tier: string | null } | null };
    
    // Get active subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, status, credits_included')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single() as { data: { tier: string | null; status: string | null; credits_included: number | null } | null };
    
    const hasCredits = (credits?.credits_remaining || 0) > 0;
    const isSubscribed = !!subscription;
    const tier = subscription?.tier;
    
    // Determine payment amount based on subscription tier
    let paymentAmount = null;
    if (!hasCredits) {
      if (isSubscribed) {
        paymentAmount = tier === 'pro' ? 499 : 899; // $4.99 for Pro, $8.99 for Starter
      } else {
        paymentAmount = 1499; // $14.99 pay-as-you-go
      }
    }
    
    return NextResponse.json({
      hasCredits,
      creditsRemaining: credits?.credits_remaining || 0,
      subscriptionTier: tier || credits?.subscription_tier || null,
      isSubscribed,
      requiresPayment: !hasCredits,
      paymentAmount,
    });
  } catch (error: any) {
    console.error('Error checking credits:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
