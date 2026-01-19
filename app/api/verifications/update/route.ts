import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/utils/supabase/admin';
import { sanitizeEmail, sanitizeName, sanitizeCompanyName } from '@/utils/sanitize';

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { 
      verification_id,
      individual_name: raw_individual_name,
      individual_email: raw_individual_email,
      requested_by_name: raw_requested_by_name,
      requested_by_email: raw_requested_by_email,
    } = body;
    
    if (!verification_id) {
      return NextResponse.json(
        { error: 'Verification ID is required' },
        { status: 400 }
      );
    }
    
    // Get verification to check ownership and status
    const { data: verification, error: fetchError } = await supabase
      .from('income_verifications')
      .select('id, user_id, status')
      .eq('id', verification_id)
      .single() as { data: { id: string; user_id: string | null; status: string } | null; error: any };
    
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
    
    // Only allow editing pending verifications
    if (verification.status !== 'pending' && verification.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Can only edit pending verifications' },
        { status: 400 }
      );
    }
    
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (raw_individual_name !== undefined) {
      const individual_name = sanitizeName(raw_individual_name);
      if (!individual_name || individual_name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Applicant name is required' },
          { status: 400 }
        );
      }
      updateData.individual_name = individual_name;
    }
    
    if (raw_individual_email !== undefined) {
      const individual_email = sanitizeEmail(raw_individual_email);
      if (!individual_email || individual_email.trim().length === 0) {
        return NextResponse.json(
          { error: 'Applicant email is required' },
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
      updateData.individual_email = individual_email;
    }
    
    if (raw_requested_by_name !== undefined) {
      updateData.requested_by_name = raw_requested_by_name 
        ? sanitizeCompanyName(raw_requested_by_name) 
        : null;
    }
    
    if (raw_requested_by_email !== undefined) {
      if (raw_requested_by_email) {
        const requested_by_email = sanitizeEmail(raw_requested_by_email);
        // Validate email format if provided
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(requested_by_email)) {
          return NextResponse.json(
            { error: 'Invalid company email format' },
            { status: 400 }
          );
        }
        updateData.requested_by_email = requested_by_email;
      } else {
        updateData.requested_by_email = null;
      }
    }
    
    // If no fields to update, return error
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }
    
    // Update verification
    const { data: updatedVerification, error: updateError } = await supabaseAdmin
      .from('income_verifications')
      .update(updateData)
      .eq('id', verification_id)
      .select()
      .single() as any;
    
    if (updateError) {
      console.error('Error updating verification:', updateError);
      return NextResponse.json(
        { error: 'Failed to update verification' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      verification: updatedVerification,
      message: 'Verification updated successfully'
    });
  } catch (error: any) {
    console.error('Error in update verification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
