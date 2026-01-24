import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { supabaseAdmin } from '@/utils/supabase/admin';

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

/**
 * GET endpoint to list recent verifications with Plaid tokens (for debugging)
 */
export async function GET(request: NextRequest) {
  try {
    const { data: verifications, error } = await supabaseAdmin
      .from('income_verifications')
      .select('verification_token, plaid_item_id, status, created_at')
      .not('plaid_access_token', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch verifications', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      verifications: verifications || [],
      message: 'Use POST with verification_token to trigger refresh',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Debug endpoint to refresh transactions for an existing Item
 * This will show up in Plaid dashboard logs and trigger data refresh
 */
export async function POST(request: NextRequest) {
  try {
    const { verification_token } = await request.json();

    if (!verification_token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Get the stored access token
    const { data: verification, error: fetchError } = await supabaseAdmin
      .from('income_verifications')
      .select('plaid_access_token, plaid_item_id')
      .eq('verification_token', verification_token)
      .single();

    if (fetchError || !verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    if (!verification.plaid_access_token) {
      return NextResponse.json(
        { error: 'No Plaid access token found. Item may have been disconnected.' },
        { status: 400 }
      );
    }

    const accessToken = verification.plaid_access_token;

    // Trigger transactions refresh - this will show up in Plaid dashboard logs
    console.log(`[REFRESH] Triggering transactions refresh for Item: ${verification.plaid_item_id}`);
    const refreshResponse = await plaidClient.transactionsRefresh({
      access_token: accessToken,
    });

    console.log(`[REFRESH] Refresh triggered successfully. Request ID: ${refreshResponse.data.request_id}`);

    return NextResponse.json({
      success: true,
      message: 'Transactions refresh triggered. Check Plaid dashboard logs to see the refresh activity.',
      request_id: refreshResponse.data.request_id,
      item_id: verification.plaid_item_id,
      note: 'Wait a few seconds, then call /transactions/get to fetch updated data',
    });
  } catch (error: any) {
    console.error('[REFRESH] Error refreshing transactions:', error?.response?.data || error);
    return NextResponse.json(
      {
        error: 'Failed to refresh transactions',
        details: error?.response?.data || error?.message,
      },
      { status: 500 }
    );
  }
}
