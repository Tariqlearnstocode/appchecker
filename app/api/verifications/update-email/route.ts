import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/utils/supabase/admin';

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { verification_id, individual_email } = body;
    
    if (!verification_id || !individual_email) {
      return NextResponse.json(
        { error: 'Verification ID and email are required' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(individual_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Get verification to check ownership and status
    const { data: verification, error: fetchError } = await supabase
      .from('income_verifications')
      .select('id, user_id, status, individual_email')
      .eq('id', verification_id)
      .single() as { data: { id: string; user_id: string | null; status: string; individual_email: string } | null; error: any };
    
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
    
    // Check if email has already been changed (prevent multiple changes)
    // We'll track this by checking if the email is different from original
    // For now, allow one change - you can add a field to track email_changes_count if needed
    
    // Update email
    const { data: updatedVerification, error: updateError } = await supabaseAdmin
      .from('income_verifications')
      .update({ individual_email } as any)
      .eq('id', verification_id)
      .select()
      .single() as any;
    
    if (updateError) {
      console.error('Error updating email:', updateError);
      return NextResponse.json(
        { error: 'Failed to update email' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      verification: updatedVerification,
      message: 'Email updated successfully'
    });
  } catch (error: any) {
    console.error('Error in update email:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
