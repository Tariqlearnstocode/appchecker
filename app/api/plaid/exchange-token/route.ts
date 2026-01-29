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

    // Store raw data - calculations happen at display time
    const { error: reportError } = await supabaseAdmin
      .from('income_verifications')
      .update({
        raw_plaid_data: rawPlaidData,
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

    // Disconnect Plaid Item immediately to avoid monthly per-Item charges
    try {
      await plaidClient.itemRemove({ access_token });
      console.log('Plaid Item disconnected');
    } catch (removeError) {
      console.error('Warning: Failed to disconnect Plaid Item:', removeError);
      // Don't fail the request - data was already saved
    }

    // Clear stored tokens after disconnect
    await supabaseAdmin
      .from('income_verifications')
      .update({
        plaid_access_token: null,
        plaid_item_id: null,
      })
      .eq('verification_token', verification_token);

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

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch transactions in 3-month chunks as fallback when sync fails
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

  let anyChunkSucceeded = false;
  let totalFetched = 0;

  for (let i = 0; i < 4; i++) {
    const chunkStart = new Date(start);
    chunkStart.setMonth(chunkStart.getMonth() + (i * 3));

    const chunkEnd = new Date(chunkStart);
    chunkEnd.setMonth(chunkEnd.getMonth() + 3);
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
              const waitTime = attempt * 10000;
              console.log(`Chunk ${i + 1} not ready, retrying in ${waitTime / 1000}s... (attempt ${attempt}/${maxRetries})`);
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
    }
  }

  if (anyChunkSucceeded) {
    console.log(`Successfully fetched ${totalFetched} transactions using 3-month chunk fallback`);
  }

  return anyChunkSucceeded;
}

/**
 * Fetch RAW Plaid data - transactions/sync with polling, fallback to 4×3-month chunks
 */
async function fetchRawPlaidData(accessToken: string, maxRetries = 3) {
  const now = new Date();
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setDate(twelveMonthsAgo.getDate() - 365);
  const startDate = twelveMonthsAgo.toISOString().split('T')[0];
  const endDate = now.toISOString().split('T')[0];

  console.log(`Calculated date range for 12 months: ${startDate} to ${endDate}`);

  const accountsResponse = await plaidClient.accountsGet({
    access_token: accessToken,
  });

  try {
    const itemResponse = await plaidClient.itemGet({ access_token: accessToken });
    const itemData = itemResponse.data.item;
    const itemWithStatus = itemResponse.data as { status?: { transactions?: { last_successful_update?: string; last_failed_update?: string } } };
    const itemStatus = itemWithStatus.status;

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
      if (!itemStatus.transactions.last_successful_update) {
        console.warn('[DEBUG] WARNING: No successful transaction update yet. Historical data may be limited.');
      }
    }
  } catch (itemError) {
    console.warn('[DEBUG] Could not fetch Item status:', itemError);
  }

  const allTransactions: any[] = [];
  let transactionsFetched = false;

  const initialWait = 15000;
  console.log(`Waiting ${initialWait / 1000}s for Plaid to extract initial transaction data...`);
  await sleep(initialWait);

  try {
    console.log('[DEBUG] STARTING TRANSACTION SYNC');
    let cursor: string | undefined = undefined;
    let pageCount = 0;
    let totalSyncAttempts = 0;
    const maxSyncAttempts = 10;
    let lastTransactionCount = 0;
    let stableCount = 0;

    while (totalSyncAttempts < maxSyncAttempts) {
      let syncResponse;
      let lastError;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          syncResponse = await plaidClient.transactionsSync({
            access_token: accessToken,
            cursor: cursor ?? undefined,
            count: 500,
            options: {
              include_original_description: true,
              personal_finance_category_version: PersonalFinanceCategoryVersion.V2,
            },
          });
          break;
        } catch (error: any) {
          lastError = error;
          const errorCode = error?.response?.data?.error_code;
          if (errorCode === 'PRODUCT_NOT_READY' && attempt < maxRetries) {
            const waitTime = attempt * 10000;
            console.log(`PRODUCT_NOT_READY: Retrying in ${waitTime / 1000}s... (attempt ${attempt}/${maxRetries})`);
            await sleep(waitTime);
          } else {
            throw error;
          }
        }
      }

      if (!syncResponse) {
        throw lastError || new Error('Failed to sync transactions after retries');
      }

      const data = syncResponse.data as { added?: any[]; removed?: any[]; modified?: any[]; next_cursor?: string; has_more?: boolean };
      const txns = data.added ?? [];
      const hasMore = data.has_more ?? false;
      cursor = data.next_cursor;
      pageCount++;
      totalSyncAttempts++;

      console.log(`[DEBUG] Sync attempt ${totalSyncAttempts}, page ${pageCount}: added=${txns.length}, has_more=${hasMore}`);

      if (txns.length > 0 && pageCount === 1) {
        const dates = txns.map((t: any) => t.date).sort();
        console.log('[DEBUG] First sync page:', { oldest_date: dates[0], newest_date: dates[dates.length - 1], total: txns.length });
      }

      allTransactions.push(...txns);
      transactionsFetched = true;

      if (allTransactions.length === lastTransactionCount) {
        stableCount++;
      } else {
        stableCount = 0;
      }
      lastTransactionCount = allTransactions.length;

      if (!hasMore) {
        if (stableCount >= 2 || (txns.length === 0 && allTransactions.length > 0)) {
          console.log(`[DEBUG] Sync complete. Total fetched: ${allTransactions.length} transactions across ${pageCount} pages`);
          break;
        }
        console.log('[DEBUG] hasMore=false, waiting 10s and polling again...');
        await sleep(10000);
        continue;
      }
    }

    if (totalSyncAttempts >= maxSyncAttempts) {
      console.warn(`[DEBUG] Reached max sync attempts (${maxSyncAttempts}).`);
    }
  } catch (error: any) {
    console.error('ERROR: Failed to sync transactions:', error?.response?.data || error);
    console.log('Sync failed, falling back to 3-month chunks...');
    try {
      transactionsFetched = await fetchTransactionsInChunks(accessToken, startDate, endDate, allTransactions, maxRetries);
    } catch (fallbackError: any) {
      console.error('Chunk fallback also failed:', fallbackError?.response?.data || fallbackError);
    }
  }

  if (!transactionsFetched) {
    console.warn('Failed to fetch any transactions');
  }

  console.log(`Total transactions fetched: ${allTransactions.length}`);

  if (allTransactions.length > 0) {
    const sortedByDate = [...allTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const actualOldest = sortedByDate[0].date;
    const actualNewest = sortedByDate[sortedByDate.length - 1].date;
    const daysDiff = Math.round(
      (new Date(actualNewest).getTime() - new Date(actualOldest).getTime()) / (1000 * 60 * 60 * 24)
    );
    console.log(`[DEBUG] Actual date range: ${actualOldest} to ${actualNewest} (${daysDiff} days), total: ${allTransactions.length}`);
  }

  const item = (await plaidClient.itemGet({ access_token: accessToken })).data.item;

  return {
    accounts: accountsResponse.data.accounts,
    item,
    transactions: allTransactions,
    total_transactions: allTransactions.length,
    fetched_at: new Date().toISOString(),
    date_range: { start: startDate, end: endDate },
    provider: 'plaid',
  };
}
