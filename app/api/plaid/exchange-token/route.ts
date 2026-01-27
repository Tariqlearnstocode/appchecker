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
 * PRIMARY: Fetch transactions using transactions/get with date range
 * This is the correct endpoint for fetching initial historical data.
 * /transactions/sync is for incremental updates after initial fetch.
 */
async function fetchTransactionsWithGet(
  accessToken: string,
  startDate: string,
  endDate: string,
  allTransactions: any[],
  maxRetries = 3
): Promise<boolean> {
  console.log(`[GET] Using transactions/get with date range: ${startDate} to ${endDate}`);
  
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
        if (errorCode === 'PRODUCT_NOT_READY' && attempt < maxRetries) {
          await sleep(attempt * 10000);
        } else {
          throw error;
        }
      }
    }

    if (!transactionsResponse) throw lastError || new Error('Failed to fetch transactions');
    
    const txns = transactionsResponse.data.transactions ?? [];
    const total = transactionsResponse.data.total_transactions ?? 0;
    
    allTransactions.push(...txns);
    console.log(`[GET] Fetched page: ${txns.length} transactions (offset ${offset}, total: ${total}, accumulated: ${allTransactions.length})`);

    if (txns.length === 0 || offset + txns.length >= total || txns.length < count) break;
    offset += txns.length;
  }

  return allTransactions.length > 0;
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
              const waitTime = attempt * 10000; // Wait 10s, 20s, 30s for historical data
              console.log(`Chunk ${i + 1} not ready, retrying in ${waitTime / 1000} seconds... (attempt ${attempt}/${maxRetries})`);
              await sleep(waitTime);
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
 * Requests 12 months of transactions, but actual availability depends on what the bank provides
 * Many banks only provide 90 days regardless of what we request
 * 
 * Strategy:
 * 1. Poll Item status to wait for historical extraction to complete (up to 2 minutes)
 * 2. PRIMARY: Use /transactions/get with date range for initial historical data
 * 3. FALLBACK: If get fails, try 3-month chunks
 * 4. OPTIONAL: Use /transactions/sync to catch any remaining transactions
 * 
 * Note: /transactions/get is for initial historical data, /transactions/sync is for incremental updates
 */
async function fetchRawPlaidData(accessToken: string, maxRetries = 3) {
  const now = new Date();
  // Calculate 12 months ago (365 days to match Link token days_requested)
  // Note: Actual data returned depends on bank - many only provide 90 days
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setDate(twelveMonthsAgo.getDate() - 365); // Use days instead of months to avoid month boundary issues
  const startDate = twelveMonthsAgo.toISOString().split('T')[0];
  const endDate = now.toISOString().split('T')[0];
  
  console.log(`Calculated date range for 12 months: ${startDate} to ${endDate}`);
  console.log(`Note: Actual data returned depends on what the bank provides (many banks only give 90 days)`);

  // Fetch accounts and balances (raw response) - usually available immediately
  const accountsResponse = await plaidClient.accountsGet({
    access_token: accessToken,
  });
  
  // DEBUG: Check Item status to see what's available and when historical data will be ready
  let itemStatus: any = null;
  try {
    const itemResponse = await plaidClient.itemGet({
      access_token: accessToken,
    });
    const itemData = itemResponse.data.item;
    const itemWithStatus = itemResponse.data as any;
    itemStatus = itemWithStatus.status;
    
    console.log('[DEBUG] Item info:', {
      item_id: itemData.item_id,
      institution_id: itemData.institution_id,
      available_products: itemData.available_products,
      billed_products: itemData.billed_products,
    });
    
    if (itemStatus?.transactions) {
      console.log('[DEBUG] Transactions status:', {
        last_successful_update: itemStatus.transactions.last_successful_update,
        last_failed_update: itemStatus.transactions.last_failed_update,
      });
      
      // CRITICAL: Check if historical data extraction failed
      if (itemStatus.transactions.last_failed_update && !itemStatus.transactions.last_successful_update) {
        console.error('[DEBUG] ❌ CRITICAL: Historical data extraction FAILED!');
        console.error('[DEBUG] ❌ last_failed_update:', itemStatus.transactions.last_failed_update);
        console.error('[DEBUG] ❌ This explains why only ~90 days are available instead of 12 months.');
        console.error('[DEBUG] ❌ Plaid failed to extract the full historical data from the bank.');
        console.error('[DEBUG] ❌ Possible causes: bank connectivity issues, bank API limitations, or Plaid service issue.');
      } else if (!itemStatus.transactions.last_successful_update) {
        console.warn('[DEBUG] ⚠️  WARNING: No successful transaction update yet. Historical data may be limited.');
      }
    }
    
    // Check if we can see what days_requested was actually used (may not be in response, but log what we expect)
    console.log('[DEBUG] Expected days_requested from Link token: 365 (12 months)');
    console.log('[DEBUG] Note: If only getting ~90 days, check last_failed_update above - extraction may have failed');
  } catch (itemError) {
    console.warn('[DEBUG] Could not fetch Item status:', itemError);
  }

  let allTransactions: any[] = [];
  let transactionsFetched = false;
  
  // CRITICAL: Poll Item status to wait for historical data extraction to complete
  // Plaid needs time to extract historical transactions after linking.
  // Historical data extraction can take time - some banks provide it immediately,
  // others may take minutes. We poll for up to 2 minutes (12 polls × 10 seconds).
  // Note: Some banks only provide 90 days of history regardless of what we request.
  console.log(`[DEBUG] ========== WAITING FOR HISTORICAL DATA EXTRACTION ==========`);
  console.log(`[DEBUG] Polling Item status to check if historical extraction is complete...`);
  console.log(`[DEBUG] Requested: 12 months (365 days) via days_requested in Link token`);
  console.log(`[DEBUG] ============================================================`);
  
  let historicalReady = false;
  let pollAttempts = 0;
  const maxPollAttempts = 12; // Poll for up to 2 minutes (12 × 10s)
  const pollInterval = 10000; // 10 seconds between polls
  
  while (!historicalReady && pollAttempts < maxPollAttempts) {
    try {
      const itemResponse = await plaidClient.itemGet({ access_token: accessToken });
      const itemWithStatus = itemResponse.data as any;
      const txStatus = itemWithStatus.status?.transactions;
      
      if (txStatus?.last_successful_update) {
        historicalReady = true;
        console.log(`[DEBUG] ✅ Historical data extraction complete. last_successful_update: ${txStatus.last_successful_update}`);
      } else if (txStatus?.last_failed_update && !txStatus?.last_successful_update) {
        console.error(`[DEBUG] ❌ Historical extraction failed. Will try anyway but may get limited data.`);
        console.error(`[DEBUG] ❌ last_failed_update: ${txStatus.last_failed_update}`);
        break; // Don't wait forever if it failed
      } else {
        pollAttempts++;
        if (pollAttempts < maxPollAttempts) {
          console.log(`[DEBUG] ⏳ Historical extraction in progress (attempt ${pollAttempts}/${maxPollAttempts}). Waiting ${pollInterval/1000}s...`);
          await sleep(pollInterval);
        }
      }
    } catch (err) {
      console.warn(`[DEBUG] Could not check Item status, proceeding anyway:`, err);
      break;
    }
  }
  
  if (!historicalReady && pollAttempts >= maxPollAttempts) {
    console.warn(`[DEBUG] ⚠️  Reached max poll attempts (${maxPollAttempts}). Proceeding with fetch - historical data may still be processing.`);
  }

  // PRIMARY: Use /transactions/get with explicit date range for initial historical data
  // /transactions/get is the correct endpoint for fetching initial historical data with a date range.
  // /transactions/sync is designed for incremental updates AFTER you've already fetched initial data.
  console.log(`[DEBUG] ========== FETCHING INITIAL HISTORICAL DATA ==========`);
  console.log(`[DEBUG] Using /transactions/get with date range: ${startDate} to ${endDate}`);
  console.log(`[DEBUG] This is the PRIMARY method for initial historical data`);
  console.log(`[DEBUG] ======================================================`);
  
  try {
    transactionsFetched = await fetchTransactionsWithGet(accessToken, startDate, endDate, allTransactions, maxRetries);
    console.log(`[DEBUG] ✅ Initial fetch complete: ${allTransactions.length} transactions`);
  } catch (error: any) {
    const errorData = error?.response?.data || {};
    console.error(`[DEBUG] ❌ /transactions/get failed:`, {
      status: error?.response?.status,
      error: errorData,
    });
    
    // FALLBACK: Try 3-month chunks if full 12-month request fails
    console.log(`[DEBUG] Trying 3-month chunks as fallback...`);
    try {
      transactionsFetched = await fetchTransactionsInChunks(accessToken, startDate, endDate, allTransactions, maxRetries);
    } catch (chunkError: any) {
      console.error(`[DEBUG] ❌ Chunking also failed:`, chunkError?.response?.data || chunkError);
    }
  }
  
  // OPTIONAL: Use /transactions/sync to catch any remaining/new transactions
  // This is called AFTER initial fetch to ensure we get everything, including any transactions
  // that may have been added during the fetch process.
  if (transactionsFetched && allTransactions.length > 0) {
    try {
      console.log(`[DEBUG] Using /transactions/sync to catch any remaining transactions...`);
      let cursor: string | undefined = undefined;
      let syncPageCount = 0;
      const syncTransactions: any[] = [];
      const existingIds = new Set(allTransactions.map((t: any) => t.transaction_id));
      
      // Only sync a few pages to catch any remaining data
      while (syncPageCount < 3) {
        const syncResponse = await plaidClient.transactionsSync({
          access_token: accessToken,
          cursor: cursor,
          count: 500,
          options: {
            include_original_description: true,
            personal_finance_category_version: PersonalFinanceCategoryVersion.V2,
          },
        });
        
        const added = syncResponse.data.added ?? [];
        if (added.length === 0 && !syncResponse.data.has_more) break;
        
        // Only add transactions we don't already have (deduplication)
        const newTxns = added.filter((t: any) => !existingIds.has(t.transaction_id));
        syncTransactions.push(...newTxns);
        
        // Update existing IDs set for next iteration
        newTxns.forEach((t: any) => existingIds.add(t.transaction_id));
        
        cursor = syncResponse.data.next_cursor;
        syncPageCount++;
        
        if (!syncResponse.data.has_more) break;
      }
      
      if (syncTransactions.length > 0) {
        console.log(`[DEBUG] ✅ Sync found ${syncTransactions.length} additional transactions`);
        allTransactions.push(...syncTransactions);
      } else {
        console.log(`[DEBUG] ✅ Sync complete - no additional transactions found`);
      }
    } catch (syncError: any) {
      console.warn(`[DEBUG] ⚠️  Sync failed (non-critical):`, syncError?.response?.data || syncError);
      // Don't fail the whole operation if sync fails - we already have the initial data
    }
  }
  
  if (!transactionsFetched) {
    console.warn(`Failed to fetch any transactions after trying both 12-month and 3-month chunk strategies`);
  }
  
  console.log(`Total transactions fetched: ${allTransactions.length}`);
  
  // Log actual date range of all fetched transactions
  if (allTransactions.length > 0) {
    const sortedByDate = [...allTransactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const actualOldest = sortedByDate[0].date;
    const actualNewest = sortedByDate[sortedByDate.length - 1].date;
    const daysDiff = Math.round(
      (new Date(actualNewest).getTime() - new Date(actualOldest).getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    const monthsDiff = Math.round(daysDiff / 30);
    const requestedDays = Math.round(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    
    console.log(`[DEBUG] ========== TRANSACTION FETCH SUMMARY ==========`);
    console.log(`[DEBUG] Requested: ${startDate} to ${endDate} (${requestedDays} days / ~12 months)`);
    console.log(`[DEBUG] Actual: ${actualOldest} to ${actualNewest} (${daysDiff} days / ~${monthsDiff} months)`);
    console.log(`[DEBUG] Total transactions fetched: ${allTransactions.length}`);
    console.log(`[DEBUG] ================================================`);
    
    if (daysDiff < requestedDays * 0.8) { // If we got less than 80% of requested
      console.warn(`⚠️  WARNING: Only fetched ~${monthsDiff} months (${daysDiff} days) of data, requested ${requestedDays} days.`);
      console.warn(`⚠️  This is likely a BANK LIMITATION - many banks only provide 90 days of transaction history.`);
      console.warn(`⚠️  Plaid can only return what the bank provides, regardless of days_requested in Link token.`);
      console.warn(`⚠️  Check Plaid dashboard Item status to see what the bank actually provides.`);
    }
  } else {
    console.error(`[DEBUG] ========== NO TRANSACTIONS FETCHED ==========`);
    console.error(`[DEBUG] Requested: ${startDate} to ${endDate}`);
    console.error(`[DEBUG] This is a critical issue - no transactions were returned.`);
    console.error(`[DEBUG] ==============================================`);
  }
  
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
