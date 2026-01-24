import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase/admin';

/**
 * Update verifications to expired status based on expires_at date
 * Called from frontend when loading verifications to mark expired ones
 */
export async function POST(request: NextRequest) {
  try {
    const { verification_ids } = await request.json();

    if (!verification_ids || !Array.isArray(verification_ids) || verification_ids.length === 0) {
      return NextResponse.json(
        { error: 'verification_ids array is required' },
        { status: 400 }
      );
    }

    // Update all specified verifications to expired status
    // Only update if they're currently pending or in_progress (not already completed/canceled)
    const { error } = await supabaseAdmin
      .from('income_verifications')
      .update({ status: 'expired' })
      .in('id', verification_ids)
      .in('status', ['pending', 'in_progress']);

    if (error) {
      console.error('Error updating expired verifications:', error);
      return NextResponse.json(
        { error: 'Failed to update expired verifications' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      updated: verification_ids.length 
    });
  } catch (error: any) {
    console.error('Error in update-expired:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
