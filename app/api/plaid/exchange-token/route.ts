import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments, PersonalFinanceCategoryVersion } from 'plaid';
import { supabaseAdmin } from '@/utils/supabase/admin';
import { sendCompletionEmail } from '@/utils/email';

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

    // Get verification details before updating (for email)
    const { data: verificationBefore } = await supabaseAdmin
      .from('income_verifications')
      .select('id, individual_name, requested_by_name, requested_by_email, user_id')
      .eq('verification_token', verification_token)
      .single() as { data: { id: string; individual_name: string; requested_by_name: string | null; requested_by_email: string | null; user_id: string | null } | null };

    // Update verification record with Plaid tokens
    const { error: updateError } = await supabaseAdmin
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

    // NOTE: Keeping Item connected for debugging - allows viewing logs in Plaid dashboard
    // TODO: Re-enable disconnect in production to avoid monthly charges
    // Transactions is billed monthly per connected Item
    // try {
    //   await plaidClient.itemRemove({ access_token });
    //   console.log('Plaid Item disconnected to avoid recurring charges');
    // } catch (removeError) {
    //   // Log but don't fail the request - data was already fetched
    //   console.error('Warning: Failed to disconnect Plaid Item:', removeError);
    // }

    // Store raw data only - calculations happen at display time
    // Keep access token for debugging (can view logs in Plaid dashboard)
    // Use admin client to bypass RLS - this is a server-side operation
    const { error: reportError } = await supabaseAdmin
      .from('income_verifications')
      .update({
        raw_plaid_data: rawPlaidData,
        plaid_access_token: access_token, // Keep for debugging - can view logs in Plaid dashboard
        status: 'completed',
        completed_at: new Date().toISOString(),
      } as any)
      .eq('verification_token', verification_token);

    if (reportError) {
      console.error('Error saving report:', reportError);
      return NextResponse.json(
        { error: 'Failed to save report data' },
        { status: 500 }
      );
    }

    // Send completion email to landlord
    if (verificationBefore?.requested_by_email) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const reportLink = `${baseUrl}/report/${verification_token}`;
        
        await sendCompletionEmail({
          to: verificationBefore.requested_by_email,
          individualName: verificationBefore.individual_name,
          requestedByName: verificationBefore.requested_by_name || 'Requesting Party',
          verificationLink: reportLink,
        });
      } catch (emailError) {
        console.error('Failed to send completion email:', emailError);
        // Don't fail the request if email fails
      }
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
 * Fetch a single 3-month chunk of transactions
 * Returns transactions array for the chunk
 */
async function fetchChunk(
  accessToken: string,
  startDate: string,
  endDate: string,
  chunkNumber: number,
  maxRetries = 5
): Promise<any[]> {
  const chunkTransactions: any[] = [];
  const count = 500;
  let offset = 0;

  console.log(`[Chunk ${chunkNumber}/4] Fetching: ${startDate} to ${endDate}`);

  while (true) {
    let response;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        response = await plaidClient.transactionsGet({
          access_token: accessToken,
          start_date: startDate,
          end_date: endDate,
          options: {
            count,
            offset,
            include_original_description: true,
            personal_finance_category_version: PersonalFinanceCategoryVersion.V2,
          },
        });
        break;
      } catch (error: any) {
        const errorCode = error?.response?.data?.error_code;
        if (errorCode === 'PRODUCT_NOT_READY' && attempt < maxRetries) {
          // Wait longer for older chunks (historical data takes time)
          const waitTime = attempt * 10000 + (chunkNumber - 1) * 5000;
          console.log(`[Chunk ${chunkNumber}/4] Not ready, waiting ${waitTime / 1000}s... (attempt ${attempt}/${maxRetries})`);
          await sleep(waitTime);
        } else if (attempt === maxRetries) {
          console.warn(`[Chunk ${chunkNumber}/4] Failed after ${maxRetries} attempts`);
          return chunkTransactions; // Return what we have
        } else {
          throw error;
        }
      }
    }

    if (!response) break;

    const txns = response.data.transactions ?? [];
    const total = response.data.total_transactions ?? 0;

    chunkTransactions.push(...txns);

    if (txns.length === 0 || offset + txns.length >= total || txns.length < count) break;
    offset += txns.length;
  }

  console.log(`[Chunk ${chunkNumber}/4] Fetched ${chunkTransactions.length} transactions`);
  return chunkTransactions;
}

/**
 * Fetch RAW Plaid data using 3-month chunks (newest first)
 *
 * Strategy: Fetch 4 chunks of 3 months each (12 months total)
 * - Chunk 1: Most recent 3 months (available after INITIAL_UPDATE)
 * - Chunks 2-4: Older data (becomes available as HISTORICAL_UPDATE progresses)
 */
async function fetchRawPlaidData(accessToken: string) {
  const now = new Date();
  const endDate = now.toISOString().split('T')[0];

  // Calculate 12 months ago
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const startDate = twelveMonthsAgo.toISOString().split('T')[0];

  console.log(`Fetching 12 months of transactions in 3-month chunks: ${startDate} to ${endDate}`);

  // Fetch accounts (available immediately)
  const accountsResponse = await plaidClient.accountsGet({
    access_token: accessToken,
  });
  console.log(`Fetched ${accountsResponse.data.accounts.length} accounts`);

  // Wait briefly for initial data to be ready
  await sleep(5000);

  // Fetch 4 chunks of 3 months each, newest first
  const allTransactions: any[] = [];

  for (let i = 0; i < 4; i++) {
    // Calculate chunk dates (newest first: 0-3mo, 3-6mo, 6-9mo, 9-12mo)
    const chunkEnd = new Date(now);
    chunkEnd.setMonth(chunkEnd.getMonth() - (i * 3));

    const chunkStart = new Date(chunkEnd);
    chunkStart.setMonth(chunkStart.getMonth() - 3);

    // Don't go before our start date
    if (chunkStart < twelveMonthsAgo) {
      chunkStart.setTime(twelveMonthsAgo.getTime());
    }

    const chunkStartStr = chunkStart.toISOString().split('T')[0];
    const chunkEndStr = chunkEnd.toISOString().split('T')[0];

    // Add delay before older chunks to let historical data extraction progress
    if (i > 0) {
      console.log(`Waiting 10s before fetching older chunk...`);
      await sleep(10000);
    }

    const chunkTransactions = await fetchChunk(
      accessToken,
      chunkStartStr,
      chunkEndStr,
      i + 1
    );

    allTransactions.push(...chunkTransactions);
  }

  // Sort all transactions by date (oldest first)
  allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  console.log(`Total transactions fetched: ${allTransactions.length}`);

  // Log actual date range
  if (allTransactions.length > 0) {
    const oldest = allTransactions[0].date;
    const newest = allTransactions[allTransactions.length - 1].date;
    console.log(`Actual date range: ${oldest} to ${newest}`);
  }

  return {
    accounts: accountsResponse.data.accounts,
    item: (await plaidClient.itemGet({ access_token: accessToken })).data.item,
    transactions: allTransactions,
    total_transactions: allTransactions.length,
    fetched_at: new Date().toISOString(),
    date_range: {
      start: startDate,
      end: endDate,
    },
    provider: 'plaid',
  };
}
