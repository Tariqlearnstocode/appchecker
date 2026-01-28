import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // Check if this is a new user (first time signing in)
      // We'll check if they have a Stripe customer ID
      const { data: profile } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', data.user.id)
        .single() as { data: { stripe_customer_id?: string | null } | null };

      // If no Stripe customer exists, create one (for new OAuth sign-ups)
      if (!profile?.stripe_customer_id && data.user.email) {
        try {
          await fetch(`${requestUrl.origin}/api/stripe/create-customer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: data.user.id,
              email: data.user.email,
            }),
          });
        } catch (stripeError) {
          console.error('Error creating Stripe customer:', stripeError);
          // Don't fail auth if Stripe customer creation fails
        }
      }
    }
  }

  // Redirect to the home page or the specified next URL
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
