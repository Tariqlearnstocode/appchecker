import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase/admin';

/**
 * Check transaction count and date range for most recent verification
 */
export async function GET(request: NextRequest) {
  try {
    // Get the most recent completed verification with Plaid data
    const { data: verification, error } = await supabaseAdmin
      .from('income_verifications')
      .select('verification_token, plaid_item_id, status, completed_at, raw_plaid_data')
      .not('raw_plaid_data', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !verification) {
      return NextResponse.json(
        { error: 'No completed verification found with Plaid data' },
        { status: 404 }
      );
    }

    const rawData = verification.raw_plaid_data as any;
    const transactions = rawData?.transactions || [];
    
    // Calculate date range
    let dateRange = 'No transactions';
    let daysDiff = 0;
    let oldestDate = '';
    let newestDate = '';
    
    if (transactions.length > 0) {
      const dates = transactions.map((t: any) => t.date).sort();
      oldestDate = dates[0];
      newestDate = dates[dates.length - 1];
      daysDiff = Math.round(
        (new Date(newestDate).getTime() - new Date(oldestDate).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      const monthsDiff = Math.round(daysDiff / 30);
      dateRange = `${oldestDate} to ${newestDate} (${daysDiff} days / ~${monthsDiff} months)`;
    }

    return NextResponse.json({
      verification_token: verification.verification_token,
      item_id: verification.plaid_item_id,
      status: verification.status,
      completed_at: verification.completed_at,
      transactions: {
        count: transactions.length,
        date_range: dateRange,
        oldest_date: oldestDate,
        newest_date: newestDate,
        days_span: daysDiff,
        months_span: Math.round(daysDiff / 30),
      },
      provider: rawData?.provider || 'unknown',
      fetched_at: rawData?.fetched_at,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to check transactions', details: error.message },
      { status: 500 }
    );
  }
}
