import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';
import { redirect } from 'next/navigation';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

/**
 * Handle Stripe checkout success redirect
 * Grants credits and redirects user
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session_id');
  
  if (!sessionId) {
    return NextResponse.redirect(new URL('/?error=missing_session', request.url));
  }
  
  try {
    // Retrieve the session to get payment details
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      // Payment succeeded - credits will be granted via webhook
      // Clear sessionStorage data and redirect
      return NextResponse.redirect(new URL('/?payment=success', request.url));
    } else {
      return NextResponse.redirect(new URL('/?payment=failed', request.url));
    }
  } catch (error) {
    console.error('Error processing success:', error);
    return NextResponse.redirect(new URL('/?payment=error', request.url));
  }
}
