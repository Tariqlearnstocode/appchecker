import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/utils/supabase/admin';
import { logAudit, getRequestContext } from '@/lib/audit';

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('API /verifications/cancel: Auth error:', authError.message, authError);
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Verification ID is required' },
        { status: 400 }
      );
    }

    // Get request context for audit logging
    const { ipAddress, userAgent } = getRequestContext(request);

    // First, verify the verification exists and belongs to the user
    const { data: verification, error: fetchError } = await supabase
      .from('income_verifications')
      .select('id, user_id, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single() as { data: { id: string; user_id: string; status: string } | null; error: any };

    if (fetchError || !verification) {
      return NextResponse.json(
        { error: 'Verification not found or access denied' },
        { status: 404 }
      );
    }

    // Check status - only allow canceling incomplete verifications
    if (verification.status !== 'pending' && verification.status !== 'in_progress') {
      return NextResponse.json(
        {
          error: 'Cannot cancel verification',
          message: verification.status === 'completed'
            ? 'Completed verifications cannot be canceled'
            : verification.status === 'failed'
            ? 'Failed verifications cannot be canceled'
            : 'Only pending or in-progress verifications can be canceled',
          currentStatus: verification.status,
        },
        { status: 400 }
      );
    }

    // Check if verification has ledger entry
    const { data: ledgerEntry, error: ledgerError } = await supabase
      .from('usage_ledger' as any)
      .select('*')
      .eq('verification_id', id)
      .is('reversed_at', null)
      .maybeSingle() as { data: any | null; error: any };

    if (ledgerError) {
      console.error('Error checking ledger entry:', ledgerError);
    }

    // If ledger entry exists, reverse it
    if (ledgerEntry) {
      const originalStatus = verification.status;
      const reversalMetadata: any = {
        cancelled_by: 'user',
        original_status: originalStatus,
        verification_status_at_cancel: originalStatus,
      };

      if (ledgerEntry.source === 'subscription') {
        // For subscription: mark as reversed
        reversalMetadata.subscription_period_start = ledgerEntry.period_start;
        reversalMetadata.subscription_period_end = ledgerEntry.period_end;

        const { error: reverseError } = await supabaseAdmin
          .from('usage_ledger' as any)
          .update({
            reversed_at: new Date().toISOString(),
            reversal_reason: 'verification_canceled',
            reversal_metadata: reversalMetadata,
            updated_at: new Date().toISOString(),
          } as any)
          .eq('id', ledgerEntry.id)
          .is('reversed_at', null);

        if (reverseError) {
          console.error('Error reversing ledger entry:', reverseError);
        }
      } else if (ledgerEntry.source === 'payg') {
        // For payg: mark as reversed AND release payment
        const { data: paymentData } = await supabaseAdmin
          .from('one_time_payments' as any)
          .select('amount')
          .eq('id', ledgerEntry.one_time_payment_id)
          .single() as { data: { amount: number } | null };

        reversalMetadata.payment_id = ledgerEntry.one_time_payment_id;
        if (paymentData) {
          reversalMetadata.payment_amount_cents = paymentData.amount;
        }

        const { error: reverseError } = await supabaseAdmin
          .from('usage_ledger' as any)
          .update({
            reversed_at: new Date().toISOString(),
            reversal_reason: 'verification_canceled',
            reversal_metadata: reversalMetadata,
            updated_at: new Date().toISOString(),
          } as any)
          .eq('id', ledgerEntry.id)
          .is('reversed_at', null);

        if (reverseError) {
          console.error('Error reversing ledger entry:', reverseError);
        }

        // Release payment
        const { error: paymentError } = await supabaseAdmin
          .from('one_time_payments' as any)
          .update({
            verification_id: null,
            used_at: null,
          } as any)
          .eq('id', ledgerEntry.one_time_payment_id)
          .eq('status', 'completed');

        if (paymentError) {
          console.error('Error releasing payment:', paymentError);
        }
      }
    }

    // Update verification status to 'canceled' (don't delete)
    const { error: updateError } = await supabaseAdmin
      .from('income_verifications')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', id)
      .eq('user_id', user.id)
      .in('status', ['pending', 'in_progress']);

    if (updateError) {
      console.error('API /verifications/cancel: Update error:', updateError.message, updateError);
      return NextResponse.json(
        { error: 'Failed to cancel verification' },
        { status: 500 }
      );
    }

    // Log to audit logs
    await logAudit({
      action: 'cancel',
      resourceType: 'verification',
      resourceId: id,
      metadata: {
        verification_id: id,
        original_status: verification.status,
        source: ledgerEntry?.source || null,
        credit_refunded: !!ledgerEntry,
        reversal_reason: ledgerEntry ? 'verification_canceled' : null,
        ...(ledgerEntry?.source === 'payg' && {
          payment_id: ledgerEntry.one_time_payment_id,
          payment_released: true,
        }),
        ...(ledgerEntry?.source === 'subscription' && {
          subscription_id: ledgerEntry.stripe_subscription_id,
          period_start: ledgerEntry.period_start,
          period_end: ledgerEntry.period_end,
        }),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'Verification canceled successfully',
      creditRefunded: !!ledgerEntry,
      source: ledgerEntry?.source || null,
    });
  } catch (error: any) {
    console.error('Error in cancel verification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
