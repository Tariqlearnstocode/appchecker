import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/utils/supabase/admin';
import { sendVerificationEmail } from '@/utils/email';
import { checkRateLimit } from '@/utils/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting: 5 emails per hour per user
    const rateLimit = checkRateLimit(`send-email:${user.id}`, 5, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          message: 'Too many email requests. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          }
        }
      );
    }
    
    const body = await request.json();
    const { verification_id } = body;
    
    if (!verification_id) {
      return NextResponse.json(
        { error: 'Verification ID is required' },
        { status: 400 }
      );
    }
    
    // Get verification details
    const { data: verification, error: fetchError } = await supabase
      .from('income_verifications')
      .select('id, individual_name, individual_email, requested_by_name, requested_by_email, purpose, verification_token, user_id')
      .eq('id', verification_id)
      .single() as { data: { id: string; individual_name: string; individual_email: string; requested_by_name: string | null; requested_by_email: string | null; purpose: string | null; verification_token: string; user_id: string | null } | null; error: any };
    
    if (fetchError || !verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }
    
    // Verify user owns this verification
    if (verification.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Generate verification link
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || 'http://localhost:3000';
    const verificationLink = `${baseUrl}/verify/${verification.verification_token}`;
    
    // Send email to applicant
    try {
      await sendVerificationEmail({
        to: verification.individual_email,
        individualName: verification.individual_name,
        requestedByName: verification.requested_by_name || 'Requesting Party',
        requestedByEmail: verification.requested_by_email,
        verificationLink,
        purpose: verification.purpose || null,
      });
      
      // Update last_email_sent_at
      await supabaseAdmin
        .from('income_verifications')
        .update({ last_email_sent_at: new Date().toISOString() } as any)
        .eq('id', verification_id);
      
      return NextResponse.json({ 
        success: true,
        message: 'Email sent successfully'
      });
    } catch (emailError: any) {
      console.error('Failed to send email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email', details: emailError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in send email:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
