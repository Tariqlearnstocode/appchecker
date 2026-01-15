import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase/admin';
import { sendCompletionEmail } from '@/utils/email';
import { checkRateLimit } from '@/utils/rate-limit';
import https from 'https';

const TELLER_API_URL = 'https://api.teller.io';

/**
 * Teller API requires Basic Auth with access_token as username and empty password
 */
function createAuthHeader(accessToken: string): string {
  const credentials = Buffer.from(`${accessToken}:`).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * Make a request to Teller API with mTLS support for development/production
 */
async function tellerFetch(url: string, options: { method?: string; headers: Record<string, string> }): Promise<Response> {
  const cert = process.env.TELLER_CERTIFICATE;
  const key = process.env.TELLER_PRIVATE_KEY;

  // If no certificates, use regular fetch (sandbox mode)
  if (!cert || !key) {
    return fetch(url, options);
  }

  // Use https.request for mTLS support
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const reqOptions: https.RequestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers,
      cert: cert.replace(/\\n/g, '\n'),
      key: key.replace(/\\n/g, '\n'),
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          ok: res.statusCode ? res.statusCode >= 200 && res.statusCode < 300 : false,
          status: res.statusCode || 500,
          json: async () => JSON.parse(data),
          text: async () => data,
        } as Response);
      });
    });

    req.on('error', reject);
    req.end();
  });
}

export async function POST(request: NextRequest) {
  try {
    const { access_token, verification_token } = await request.json();

    if (!access_token || !verification_token) {
      return NextResponse.json(
        { error: 'Access token and verification token are required' },
        { status: 400 }
      );
    }

    // Rate limiting: 5 Teller API calls per hour per verification token
    // This prevents abuse of the external Teller API (costs money)
    const rateLimit = checkRateLimit(`teller-fetch:${verification_token}`, 5, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          message: 'Too many data fetch requests. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          }
        }
      );
    }

    const authHeader = createAuthHeader(access_token);
    const headers = { Authorization: authHeader };

    // 1. Fetch all accounts
    console.log('Fetching accounts from Teller API...');
    let accountsRes;
    try {
      accountsRes = await tellerFetch(`${TELLER_API_URL}/accounts`, { headers });
    } catch (err) {
      console.error('Connection error fetching accounts:', {
        error: err,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      return NextResponse.json(
        { error: 'Failed to connect to Teller API', details: err instanceof Error ? err.message : String(err) },
        { status: 500 }
      );
    }

    if (!accountsRes.ok) {
      const errData = await accountsRes.json().catch(() => ({}));
      console.error('Failed to fetch accounts:', {
        status: accountsRes.status,
        statusText: accountsRes.statusText,
        error: errData,
      });
      return NextResponse.json(
        { error: 'Failed to fetch accounts', details: errData },
        { status: accountsRes.status }
      );
    }

    const accounts = await accountsRes.json();
    console.log(`Successfully fetched ${accounts?.length || 0} account(s) from Teller API`);

    // 2. Fetch balances for each account
    console.log('Fetching balances for all accounts...');
    const accountsWithBalances = await Promise.all(
      accounts.map(async (account: any) => {
        try {
          const balanceRes = await tellerFetch(
            `${TELLER_API_URL}/accounts/${account.id}/balances`,
            { headers }
          );
          if (balanceRes.ok) {
            const balances = await balanceRes.json();
            console.log(`Successfully fetched balance for account ${account.id} (${account.institution?.name || 'unknown'}): ledger=${balances?.ledger || 'N/A'}, available=${balances?.available || 'N/A'}`);
            return { ...account, balances };
          } else {
            const errorData = await balanceRes.json().catch(() => ({}));
            console.error(`Failed to fetch balance for account ${account.id}:`, {
              status: balanceRes.status,
              statusText: balanceRes.statusText,
              error: errorData,
              accountInstitution: account.institution?.name,
            });
            return { ...account, balances: null };
          }
        } catch (err) {
          console.error(`Connection error fetching balance for account ${account.id}:`, {
            error: err,
            message: err instanceof Error ? err.message : String(err),
            accountInstitution: account.institution?.name,
          });
          return { ...account, balances: null };
        }
      })
    );

    // 3. Fetch transactions for each account (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const startDate = twelveMonthsAgo.toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];

    let allTransactions: any[] = [];

    for (const account of accounts) {
      try {
        const txnUrl = `${TELLER_API_URL}/accounts/${account.id}/transactions?start_date=${startDate}&end_date=${endDate}`;
        console.log(`Fetching transactions for account ${account.id} (${account.institution?.name || 'unknown'}): ${txnUrl}`);
        
        const txnRes = await tellerFetch(txnUrl, { headers });
        
        if (txnRes.ok) {
          const transactions = await txnRes.json();
          console.log(`Successfully fetched transactions for account ${account.id}: ${transactions?.length || 0} transactions returned`);
          allTransactions = allTransactions.concat(transactions);
        } else {
          const errorData = await txnRes.json().catch(() => ({}));
          console.error(`Failed to fetch transactions for account ${account.id}:`, {
            status: txnRes.status,
            statusText: txnRes.statusText,
            error: errorData,
            accountInstitution: account.institution?.name,
            accountType: account.type,
            accountSubtype: account.subtype,
          });
        }
      } catch (err) {
        console.error(`Connection error fetching transactions for account ${account.id}:`, {
          error: err,
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
          accountInstitution: account.institution?.name,
          accountType: account.type,
          accountSubtype: account.subtype,
        });
      }
    }
    
    console.log(`Total transactions fetched: ${allTransactions.length} across ${accounts.length} account(s)`);

    // 4. Store raw data in database
    const rawTellerData = {
      accounts: accountsWithBalances,
      transactions: allTransactions,
      fetched_at: new Date().toISOString(),
      date_range: { start: startDate, end: endDate },
      provider: 'teller',
    };

    // Get verification details before updating (for email)
    const { data: verificationBefore } = await supabaseAdmin
      .from('income_verifications')
      .select('id, individual_name, requested_by_name, requested_by_email, user_id')
      .eq('verification_token', verification_token)
      .single() as { data: { id: string; individual_name: string; requested_by_name: string | null; requested_by_email: string | null; user_id: string | null } | null };

    // Use admin client to bypass RLS - this is a server-side operation
    // triggered by the applicant, but needs to update the landlord's verification
    const { error: updateError } = await supabaseAdmin
      .from('income_verifications')
      .update({
        raw_plaid_data: rawTellerData, // Reusing the same column for Teller data
        status: 'completed',
        completed_at: new Date().toISOString(),
      } as any)
      .eq('verification_token', verification_token);

    if (updateError) {
      console.error('Error saving report:', updateError);
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

    // 5. Delete all account connections to stop recurring charges
    // Teller charges per active enrollment, so we must disconnect after fetching
    console.log(`Disconnecting ${accounts.length} account(s) from Teller...`);
    
    const disconnectResults = await Promise.all(
      accounts.map(async (account: any) => {
      try {
          const deleteRes = await tellerFetch(`${TELLER_API_URL}/accounts/${account.id}`, {
          method: 'DELETE',
            headers,
          });
          if (deleteRes.ok) {
            console.log(`Successfully disconnected account ${account.id}`);
            return { id: account.id, success: true };
          } else {
            const errText = await deleteRes.text().catch(() => 'Unknown error');
            console.error(`Failed to disconnect account ${account.id}: ${errText}`);
            return { id: account.id, success: false, error: errText };
          }
        } catch (err: any) {
          console.error(`Error disconnecting account ${account.id}:`, err?.message);
          return { id: account.id, success: false, error: err?.message };
      }
      })
    );
    
    const disconnectedCount = disconnectResults.filter(r => r.success).length;
    console.log(`Disconnected ${disconnectedCount}/${accounts.length} accounts from Teller`);

    return NextResponse.json({ 
      success: true,
      disconnected: disconnectedCount,
      total_accounts: accounts.length
    });
  } catch (error: any) {
    console.error('Error fetching Teller data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial data', details: error?.message },
      { status: 500 }
    );
  }
}

