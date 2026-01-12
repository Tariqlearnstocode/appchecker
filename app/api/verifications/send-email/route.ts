import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sendVerificationEmail } from '@/utils/email';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      .single();
    
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
      await supabase
        .from('income_verifications')
        .update({ last_email_sent_at: new Date().toISOString() })
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
