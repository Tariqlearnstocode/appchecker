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

    // Fetch all the data
    const reportData = await fetchPlaidData(access_token);

    // Update with report data
    const { error: reportError } = await supabase
      .from('income_verifications')
      .update({
        report_data: reportData,
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

async function fetchPlaidData(accessToken: string) {
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // Fetch accounts and balances
  const accountsResponse = await plaidClient.accountsGet({
    access_token: accessToken,
  });

  // Fetch transactions
  const transactionsResponse = await plaidClient.transactionsGet({
    access_token: accessToken,
    start_date: threeMonthsAgo.toISOString().split('T')[0],
    end_date: now.toISOString().split('T')[0],
    options: {
      count: 500,
    },
  });

  // Process transactions to estimate income
  const transactions = transactionsResponse.data.transactions;
  const accounts = accountsResponse.data.accounts;

  // Identify income (deposits) - transactions with positive amounts
  const incomeTransactions = transactions.filter((t) => t.amount < 0); // In Plaid, negative = money coming in
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Calculate monthly income estimate
  const monthlyIncome = totalIncome / 3;

  // Identify recurring income patterns (potential paychecks)
  const recurringDeposits = identifyRecurringDeposits(incomeTransactions);

  // Get total balances
  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balances.current || 0), 0);
  const totalAvailable = accounts.reduce((sum, acc) => sum + (acc.balances.available || 0), 0);

  // Categorize expenses
  const expenses = transactions.filter((t) => t.amount > 0);
  const expensesByCategory = categorizeTransactions(expenses);

  return {
    summary: {
      total_income_3mo: totalIncome,
      estimated_monthly_income: monthlyIncome,
      total_balance: totalBalance,
      total_available: totalAvailable,
      account_count: accounts.length,
      transaction_count: transactions.length,
    },
    accounts: accounts.map((acc) => ({
      name: acc.name,
      official_name: acc.official_name,
      type: acc.type,
      subtype: acc.subtype,
      current_balance: acc.balances.current,
      available_balance: acc.balances.available,
      mask: acc.mask,
    })),
    income: {
      total_3mo: totalIncome,
      monthly_estimate: monthlyIncome,
      recurring_deposits: recurringDeposits,
      all_deposits: incomeTransactions.slice(0, 50).map((t) => ({
        date: t.date,
        amount: Math.abs(t.amount),
        name: t.name,
        category: t.category,
      })),
    },
    expenses: {
      total_3mo: expenses.reduce((sum, t) => sum + t.amount, 0),
      by_category: expensesByCategory,
    },
    transactions: transactions.slice(0, 100).map((t) => ({
      date: t.date,
      amount: t.amount,
      name: t.name,
      category: t.category?.join(', '),
      pending: t.pending,
    })),
    generated_at: new Date().toISOString(),
  };
}

function identifyRecurringDeposits(incomeTransactions: any[]) {
  // Group by approximate amount (within 10%)
  const groups: Record<string, any[]> = {};

  incomeTransactions.forEach((t) => {
    const amount = Math.abs(t.amount);
    const key = Math.round(amount / 100) * 100; // Round to nearest $100
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  // Find groups with 2+ transactions (potentially recurring)
  const recurring = Object.entries(groups)
    .filter(([_, txns]) => txns.length >= 2)
    .map(([amount, txns]) => ({
      approximate_amount: parseFloat(amount),
      occurrences: txns.length,
      dates: txns.map((t) => t.date),
      likely_source: txns[0]?.name,
    }));

  return recurring;
}

function categorizeTransactions(transactions: any[]) {
  const categories: Record<string, number> = {};

  transactions.forEach((t) => {
    const category = t.category?.[0] || 'Other';
    categories[category] = (categories[category] || 0) + t.amount;
  });

  return Object.entries(categories)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => ({ category, amount }));
}

