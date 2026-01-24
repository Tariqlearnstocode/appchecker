import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments, PersonalFinanceCategoryVersion } from 'plaid';
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
 * Debug endpoint to fetch transactions for an existing Item
 * This will show up in Plaid dashboard logs and help debug date range issues
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

    console.log(`[FETCH] Testing transactions/sync for Item: ${verification.plaid_item_id}`);
    console.log(`[FETCH] Using /transactions/sync endpoint (recommended for historical data)`);

    // Use transactions/sync instead of transactions/get
    const allTransactions: any[] = [];
    let cursor: string | undefined = undefined;
    let pageCount = 0;
    let requestId = '';

    while (true) {
      const response = await plaidClient.transactionsSync({
        access_token: accessToken,
        cursor: cursor,
        count: 500,
        options: {
          include_original_description: true,
          personal_finance_category_version: PersonalFinanceCategoryVersion.V2,
        },
      });

      const txns = response.data.added ?? [];
      const hasMore = response.data.has_more;
      cursor = response.data.next_cursor;
      if (!requestId) requestId = response.data.request_id;
      pageCount++;

      allTransactions.push(...txns);
      console.log(`[FETCH] Sync page ${pageCount}: added=${txns.length}, has_more=${hasMore}, removed=${response.data.removed?.length || 0}, modified=${response.data.modified?.length || 0}, accumulated: ${allTransactions.length}`);

      // Break when we've fetched all available transactions
      if (!hasMore) {
        console.log(`[FETCH] Sync complete. Fetched ${allTransactions.length} transactions across ${pageCount} pages`);
        break;
      }
    }

    // Calculate actual date range
    let dateRange = 'No transactions';
    let daysDiff = 0;
    if (allTransactions.length > 0) {
      const dates = allTransactions.map((t: any) => t.date).sort();
      const oldest = dates[0];
      const newest = dates[dates.length - 1];
      daysDiff = Math.round(
        (new Date(newest).getTime() - new Date(oldest).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      dateRange = `${oldest} to ${newest} (${daysDiff} days)`;
    }

    return NextResponse.json({
      success: true,
      message: 'Transactions fetched using /transactions/sync. Check Plaid dashboard logs to see the requests.',
      request_id: requestId,
      item_id: verification.plaid_item_id,
      response: {
        transactions_fetched: allTransactions.length,
        actual_date_range: dateRange,
        days_span: daysDiff,
        pages_fetched: pageCount,
        method: 'transactions/sync',
      },
      note: 'This call will appear in Plaid dashboard logs as /transactions/sync requests. Sync uses cursor-based pagination and should fetch all available historical data based on days_requested in Link token.',
    });
  } catch (error: any) {
    console.error('[FETCH] Error fetching transactions:', error?.response?.data || error);
    return NextResponse.json(
      {
        error: 'Failed to fetch transactions',
        details: error?.response?.data || error?.message,
      },
      { status: 500 }
    );
  }
}
