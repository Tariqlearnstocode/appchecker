import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { createClient } from '@/utils/supabase/server';

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

export async function POST(request: NextRequest) {
  try {
    const { public_token, verification_token } = await request.json();

    if (!public_token || !verification_token) {
      return NextResponse.json(
        { error: 'Public token and verification token are required' },
        { status: 400 }
      );
    }

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const { access_token, item_id } = exchangeResponse.data;

    // Update verification record with Plaid tokens
    const supabase = await createClient();
    const { error: updateError } = await supabase
      .from('income_verifications')
      .update({
        plaid_access_token: access_token,
        plaid_item_id: item_id,
        status: 'in_progress',
      })
      .eq('verification_token', verification_token);

    if (updateError) {
      console.error('Error updating verification:', updateError);
      return NextResponse.json(
        { error: 'Failed to update verification record' },
        { status: 500 }
      );
    }

    // Fetch RAW data from Plaid (no calculations here)
    const rawPlaidData = await fetchRawPlaidData(access_token);

    // IMPORTANT: Disconnect the Item immediately to avoid monthly charges
    // Transactions is billed monthly per connected Item
    try {
      await plaidClient.itemRemove({ access_token });
      console.log('Plaid Item disconnected to avoid recurring charges');
    } catch (removeError) {
      // Log but don't fail the request - data was already fetched
      console.error('Warning: Failed to disconnect Plaid Item:', removeError);
    }

    // Store raw data only - calculations happen at display time
    // Clear the access token since we've disconnected
    const { error: reportError } = await supabase
      .from('income_verifications')
      .update({
        raw_plaid_data: rawPlaidData,
        plaid_access_token: null, // Clear since Item is disconnected
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('verification_token', verification_token);

    if (reportError) {
      console.error('Error saving report:', reportError);
      return NextResponse.json(
        { error: 'Failed to save report data' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error exchanging token:', error?.response?.data || error);
    return NextResponse.json(
      { error: 'Failed to exchange token', details: error?.response?.data },
      { status: 500 }
    );
  }
}

/**
 * Sleep helper
 */
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch RAW Plaid data - no calculations, just the API responses
 * Includes retry logic for PRODUCT_NOT_READY errors
 */
async function fetchRawPlaidData(accessToken: string, maxRetries = 3) {
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // Fetch accounts and balances (raw response) - usually available immediately
  const accountsResponse = await plaidClient.accountsGet({
    access_token: accessToken,
  });

  // Fetch transactions with retry logic
  // Transactions may not be immediately available after linking
  let transactionsResponse;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      transactionsResponse = await plaidClient.transactionsGet({
        access_token: accessToken,
        start_date: threeMonthsAgo.toISOString().split('T')[0],
        end_date: now.toISOString().split('T')[0],
        options: {
          count: 500,
        },
      });
      break; // Success - exit loop
    } catch (error: any) {
      lastError = error;
      const errorCode = error?.response?.data?.error_code;
      
      // Only retry on PRODUCT_NOT_READY
      if (errorCode === 'PRODUCT_NOT_READY' && attempt < maxRetries) {
        console.log(`Transactions not ready, retrying in ${attempt * 2} seconds... (attempt ${attempt}/${maxRetries})`);
        await sleep(attempt * 2000); // Wait 2s, 4s, 6s
      } else {
        throw error; // Don't retry on other errors
      }
    }
  }

  if (!transactionsResponse) {
    throw lastError || new Error('Failed to fetch transactions after retries');
  }

  // Store raw responses
  return {
    accounts: accountsResponse.data.accounts,
    item: accountsResponse.data.item,
    transactions: transactionsResponse.data.transactions,
    total_transactions: transactionsResponse.data.total_transactions,
    fetched_at: new Date().toISOString(),
    date_range: {
      start: threeMonthsAgo.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0],
    },
  };
}
