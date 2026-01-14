import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/utils/supabase/admin';
import { sendReminderEmail } from '@/utils/email';
import { checkRateLimit } from '@/utils/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting: 5 reminder emails per hour per user
    const rateLimit = checkRateLimit(`send-reminder:${user.id}`, 5, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          message: 'Too many reminder requests. Please try again later.',
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
      .select('id, individual_name, individual_email, requested_by_name, verification_token, expires_at, user_id, status, last_reminder_sent_at, reminder_count')
      .eq('id', verification_id)
      .single() as { data: { id: string; individual_name: string; individual_email: string; requested_by_name: string | null; verification_token: string; expires_at: string; user_id: string | null; status: string; last_reminder_sent_at: string | null; reminder_count: number | null } | null; error: any };
    
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
    
    // Check if verification is still active
    if (verification.status === 'completed' || verification.status === 'expired') {
      return NextResponse.json(
        { error: 'Cannot send reminder for completed or expired verification' },
        { status: 400 }
      );
    }
    
    // Calculate days remaining
    const expiresAt = new Date(verification.expires_at);
    const now = new Date();
    const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 0) {
      return NextResponse.json(
        { error: 'Verification has expired' },
        { status: 400 }
      );
    }
    
    // Generate verification link
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || 'http://localhost:3000';
    const verificationLink = `${baseUrl}/verify/${verification.verification_token}`;
    
    // Send reminder email
    try {
      await sendReminderEmail({
        to: verification.individual_email,
        individualName: verification.individual_name,
        requestedByName: verification.requested_by_name || 'Requesting Party',
        verificationLink,
        daysRemaining,
      });
      
      // Update last_reminder_sent_at and increment reminder_count
      const newReminderCount = (verification.reminder_count || 0) + 1;
      await supabaseAdmin
        .from('income_verifications')
        .update({ 
          last_reminder_sent_at: new Date().toISOString(),
          reminder_count: newReminderCount,
        } as any)
        .eq('id', verification_id);
      
      return NextResponse.json({ 
        success: true,
        message: 'Reminder email sent successfully',
        reminderCount: newReminderCount,
      });
    } catch (emailError: any) {
      console.error('Failed to send reminder email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send reminder email', details: emailError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in send reminder:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
