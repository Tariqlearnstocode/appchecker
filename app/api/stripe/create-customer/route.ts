import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getOrCreateStripeCustomer } from '@/lib/stripe/helpers';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // If no user from session, try to get from request body (for immediate post-signup)
    let userId: string | null = user?.id || null;
    let userEmail: string | null = user?.email || null;

    if (!userId) {
      try {
        const body = await request.json();
        userId = body.userId || null;
        userEmail = body.email || null;
      } catch {
        // No body provided, will use session user
      }
    }

    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'User ID and email are required' }, { status: 400 });
    }

    // Get or create Stripe customer (will check if exists first)
    const customerId = await getOrCreateStripeCustomer(
      userId,
      userEmail
    );

    return NextResponse.json({ 
      success: true,
      customerId 
    });
  } catch (error: any) {
    console.error('Error creating Stripe customer:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe customer', details: error.message },
      { status: 500 }
    );
  }
}
