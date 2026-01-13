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
      .select('credits_remaining')
      .eq('user_id', user.id)
      .single() as { data: { credits_remaining: number } | null };
    
    const hasCredits = (credits?.credits_remaining || 0) > 0;
    
    // Determine payment amount (pay-as-you-go pricing)
    let paymentAmount = null;
    if (!hasCredits) {
      paymentAmount = 1499; // $14.99 pay-as-you-go
    }
    
    return NextResponse.json({
      hasCredits,
      creditsRemaining: credits?.credits_remaining || 0,
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
