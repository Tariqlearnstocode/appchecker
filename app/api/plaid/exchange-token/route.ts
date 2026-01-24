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
    // Use admin client to bypass RLS - this is a server-side operation
    const { error: reportError } = await supabaseAdmin
      .from('income_verifications')
      .update({
        raw_plaid_data: rawPlaidData,
        plaid_access_token: null, // Clear since Item is disconnected
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
 * Fetch transactions in 3-month chunks as fallback when 12-month request fails
 */
async function fetchTransactionsInChunks(
  accessToken: string,
  startDate: string,
  endDate: string,
  allTransactions: any[],
  maxRetries = 3
): Promise<boolean> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const chunkMonths = 3;
  let totalFetched = 0;
  let anyChunkSucceeded = false;

  // Split into 4 chunks of 3 months each (12 months total)
  for (let i = 0; i < 4; i++) {
    const chunkStart = new Date(start);
    chunkStart.setMonth(chunkStart.getMonth() + (i * chunkMonths));
    
    const chunkEnd = new Date(chunkStart);
    chunkEnd.setMonth(chunkEnd.getMonth() + chunkMonths);
    // Make sure we don't go past the original end date
    if (chunkEnd > end) {
      chunkEnd.setTime(end.getTime());
    }

    const chunkStartStr = chunkStart.toISOString().split('T')[0];
    const chunkEndStr = chunkEnd.toISOString().split('T')[0];

    try {
      console.log(`Fetching 3-month chunk ${i + 1}/4: ${chunkStartStr} to ${chunkEndStr}`);
      const chunkCount = 500;
      let chunkOffset = 0;
      const chunkTransactions: any[] = [];

      chunkLoop: while (true) {
        let chunkResponse;
        let lastChunkError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            chunkResponse = await plaidClient.transactionsGet({
              access_token: accessToken,
              start_date: chunkStartStr,
              end_date: chunkEndStr,
              options: {
                count: chunkCount,
                offset: chunkOffset,
                include_original_description: true,
                personal_finance_category_version: PersonalFinanceCategoryVersion.V2,
              },
            });
            break;
          } catch (error: any) {
            lastChunkError = error;
            const errorCode = error?.response?.data?.error_code;
            if (errorCode === 'PRODUCT_NOT_READY' && attempt < maxRetries) {
              console.log(`Chunk ${i + 1} not ready, retrying in ${attempt * 2} seconds... (attempt ${attempt}/${maxRetries})`);
              await sleep(attempt * 2000);
            } else {
              throw error;
            }
          }
        }

        if (!chunkResponse) throw lastChunkError || new Error('Chunk fetch failed');
        const txns = chunkResponse.data.transactions ?? [];
        const total = chunkResponse.data.total_transactions ?? 0;

        chunkTransactions.push(...txns);
        // Break if: no more transactions, reached total, or got fewer than requested (last page)
        if (txns.length === 0 || chunkOffset + txns.length >= total || txns.length < chunkCount) break chunkLoop;
        chunkOffset += txns.length;
      }

      if (chunkTransactions.length > 0) {
        totalFetched += chunkTransactions.length;
        allTransactions.push(...chunkTransactions);
        anyChunkSucceeded = true;
        console.log(`Successfully fetched chunk ${i + 1}/4: ${chunkTransactions.length} transactions (${chunkStartStr} to ${chunkEndStr})`);
      } else {
        console.error(`Failed to fetch chunk ${i + 1}/4: ${chunkStartStr} to ${chunkEndStr}`);
      }
    } catch (err) {
      console.error(`Connection error fetching chunk ${i + 1}/4:`, {
        error: err,
        message: err instanceof Error ? err.message : String(err),
        dateRange: { start: chunkStartStr, end: chunkEndStr },
      });
      // Continue with next chunk even if one fails
    }
  }

  if (anyChunkSucceeded) {
    console.log(`Successfully fetched ${totalFetched} transactions using 3-month chunk fallback`);
  }

  return anyChunkSucceeded;
}

/**
 * Fetch RAW Plaid data - no calculations, just the API responses
 * Fetches 12 months of transactions (matching Teller's approach)
 * Includes retry logic for PRODUCT_NOT_READY errors
 * Falls back to 4 chunks of 3 months if 12-month request fails
 */
async function fetchRawPlaidData(accessToken: string, maxRetries = 3) {
  const now = new Date();
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const startDate = twelveMonthsAgo.toISOString().split('T')[0];
  const endDate = now.toISOString().split('T')[0];

  // Fetch accounts and balances (raw response) - usually available immediately
  const accountsResponse = await plaidClient.accountsGet({
    access_token: accessToken,
  });

  let allTransactions: any[] = [];
  let transactionsFetched = false;

  // First, try 12 months in one request
  try {
    console.log(`Fetching transactions: ${startDate} to ${endDate}`);
    
    const count = 500;
    let offset = 0;

    while (true) {
      let transactionsResponse;
      let lastError;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          transactionsResponse = await plaidClient.transactionsGet({
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

      const txns = transactionsResponse.data.transactions ?? [];
      const total = transactionsResponse.data.total_transactions ?? 0;

      if (txns.length > 0 && offset === 0) {
        const rawTxn = txns[0];
        console.log('RAW Plaid response (first transaction):', {
          transaction_id: rawTxn.transaction_id,
          original_description: rawTxn.original_description,
          name: rawTxn.name,
          merchant_name: rawTxn.merchant_name,
        });
      }
      if (txns.length === 0 && offset === 0) {
        console.warn(`WARNING: Empty transaction array returned. This may indicate the date range exceeds bank's available history.`);
      }

      allTransactions.push(...txns);
      transactionsFetched = true;
      console.log(`Fetched page: ${txns.length} transactions (offset ${offset}, total available: ${total})`);

      // Break if: no more transactions, reached total, or got fewer than requested (last page)
      if (txns.length === 0 || offset + txns.length >= total || txns.length < count) break;
      offset += txns.length;
    }
  } catch (error: any) {
    const errorData = error?.response?.data || {};
    const isTimeout = error?.response?.status === 504 || errorData?.error_code === 'GATEWAY_TIMEOUT';
    
    console.error(`ERROR: Failed to fetch transactions:`, {
      status: error?.response?.status,
      error: errorData,
      requestedDateRange: { start: startDate, end: endDate },
    });
    
    // If it's a timeout or large request error, try fallback to 3-month chunks
    if (isTimeout || errorData?.error_code === 'INVALID_REQUEST') {
      console.log(`Timeout or error detected for 12-month request. Falling back to 3-month chunks...`);
      transactionsFetched = await fetchTransactionsInChunks(accessToken, startDate, endDate, allTransactions, maxRetries);
    } else {
      // For other errors, try chunking as fallback anyway
      console.log(`Error for 12-month request. Falling back to 3-month chunks...`);
      transactionsFetched = await fetchTransactionsInChunks(accessToken, startDate, endDate, allTransactions, maxRetries);
    }
  }
  
  if (!transactionsFetched) {
    console.warn(`Failed to fetch any transactions after trying both 12-month and 3-month chunk strategies`);
  }
  
  console.log(`Total transactions fetched: ${allTransactions.length}`);
  
  // Final check: Log a transaction that should have full original_description
  // Look for income transactions (negative amount in Plaid) that might have payroll keywords
  const incomeTxns = allTransactions.filter((t: any) => t.amount < 0).slice(0, 3);
  if (incomeTxns.length > 0) {
    console.log('Sample income transactions (checking original_description):');
    incomeTxns.forEach((txn: any, idx: number) => {
      console.log(`  Transaction ${idx + 1}:`, {
        transaction_id: txn.transaction_id,
        date: txn.date,
        amount: txn.amount,
        original_description: txn.original_description,
        original_description_length: txn.original_description?.length,
        name: txn.name,
        name_length: txn.name?.length,
        are_equal: txn.original_description === txn.name,
      });
    });
  }

  // Store raw responses with provider field - NO PROCESSING, store exactly as Plaid returns
  return {
    accounts: accountsResponse.data.accounts,
    item: accountsResponse.data.item,
    transactions: allTransactions, // Raw Plaid transactions, unmodified
    total_transactions: allTransactions.length,
    fetched_at: new Date().toISOString(),
    date_range: {
      start: startDate,
      end: endDate,
    },
    provider: 'plaid', // CRITICAL: Must be set for normalization layer
  };
}
