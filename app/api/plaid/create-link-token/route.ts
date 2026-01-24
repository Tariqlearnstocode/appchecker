import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

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
    const { verification_token, applicant_name } = await request.json();

    if (!verification_token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const daysRequested = 365; // Request 12 months (365 days) - actual availability depends on bank
    
    console.log(`[LINK_TOKEN] Creating Link token with days_requested: ${daysRequested} (12 months)`);
    
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: verification_token,
      },
      client_name: 'Income Verification',
      products: [Products.Transactions], // Only transactions - we don't need Auth (routing numbers)
      country_codes: [CountryCode.Us],
      language: 'en',
      transactions: {
        days_requested: daysRequested,
      },
      // Note: Data Transparency Messaging (DTM) use cases must be configured in Plaid Dashboard
      // Go to: https://dashboard.plaid.com/link/data-transparency-v5
      // Required for production: Select at least one use case (e.g., "Verify your income")
    });

    console.log(`[LINK_TOKEN] Link token created successfully. Request ID: ${response.data.request_id}`);
    console.log(`[LINK_TOKEN] Verification: days_requested=${daysRequested} was sent to Plaid`);

    return NextResponse.json({ link_token: response.data.link_token });
  } catch (error: any) {
    console.error('Error creating link token:', error?.response?.data || error);
    return NextResponse.json(
      { error: 'Failed to create link token', details: error?.response?.data },
      { status: 500 }
    );
  }
}

