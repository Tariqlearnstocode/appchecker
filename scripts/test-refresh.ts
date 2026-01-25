/**
 * Helper script to test the refresh endpoint
 * Gets the most recent verification with Plaid access token and calls refresh
 */

import { supabaseAdmin } from '../utils/supabase/admin';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

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

async function testRefresh() {
  try {
    // Get the most recent completed verification with Plaid access token
    const { data: verifications, error } = await supabaseAdmin
      .from('income_verifications')
      .select('verification_token, plaid_access_token, plaid_item_id, status, created_at')
      .not('plaid_access_token', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !verifications || verifications.length === 0) {
      console.error('No verifications with Plaid access tokens found');
      console.error('Error:', error);
      process.exit(1);
    }

    const verification = verifications[0];
    console.log('Found verification:', {
      token: verification.verification_token,
      item_id: verification.plaid_item_id,
      status: verification.status,
      created_at: verification.created_at,
    });

    if (!verification.plaid_access_token) {
      console.error('No access token found');
      process.exit(1);
    }

    // Call refresh
    console.log('\n🔄 Triggering transactions refresh...');
    const refreshResponse = await plaidClient.transactionsRefresh({
      access_token: verification.plaid_access_token,
    });

    console.log('✅ Refresh triggered successfully!');
    console.log('Request ID:', refreshResponse.data.request_id);
    console.log('\n📊 Next steps:');
    console.log('1. Check Plaid dashboard logs - you should see the refresh request');
    console.log('2. Wait a few seconds for Plaid to process');
    console.log('3. The refresh will show up in the dashboard as a new REQUEST entry');
    console.log('\n💡 To test fetching after refresh, you can:');
    console.log(`   - Use verification_token: ${verification.verification_token}`);
    console.log(`   - Or manually call /transactions/get with the access token`);
  } catch (error: any) {
    console.error('❌ Error:', error?.response?.data || error);
    process.exit(1);
  }
}

testRefresh();
