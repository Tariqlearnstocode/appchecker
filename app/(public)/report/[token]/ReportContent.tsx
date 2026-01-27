'use client';

import React, { useState, useMemo } from 'react';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { IncomeReport, formatCurrency, formatDate } from '@/lib/income-calculations';

// Support both new calculated format and legacy format
interface LegacyReportData {
  summary: {
    total_income_3mo: number;
    estimated_monthly_income: number;
    total_balance: number;
    total_available: number;
    account_count: number;
    transaction_count: number;
  };
  accounts: Array<{
    name: string;
    official_name: string | null;
    type: string;
    subtype: string | null;
    current_balance: number | null;
    available_balance: number | null;
    mask: string | null;
  }>;
  income: {
    total_3mo: number;
    monthly_estimate: number;
    recurring_deposits: Array<{
      approximate_amount: number;
      occurrences: number;
      dates: string[];
      likely_source: string;
    }>;
    all_deposits: Array<{
      date: string;
      amount: number;
      name: string;
      category: string[] | null;
    }>;
  };
  expenses: {
    total_3mo: number;
    by_category: Array<{
      category: string;
      amount: number;
    }>;
  };
  transactions: Array<{
    date: string;
    amount: number;
    name: string;
    category: string | null;
    pending: boolean;
  }>;
  generated_at: string;
}

interface Props {
  verification: {
    individual_name: string;
    individual_email: string;
    requested_by_name?: string | null;
    purpose?: string | null;
    monthly_rent?: number | null;
    created_at: string;
    completed_at: string;
  };
  reportData: IncomeReport | LegacyReportData;
  isCalculated?: boolean;
}

// Normalize data to a common format
function normalizeReportData(data: IncomeReport | LegacyReportData) {
  // Check if it's the new format (has camelCase properties)
  if ('totalIncome3Mo' in (data.summary as any)) {
    const d = data as IncomeReport;
    return {
      summary: {
        totalIncome12Mo: d.summary.totalIncome12Mo,
        totalIncome3Mo: d.summary.totalIncome3Mo,
        estimatedMonthlyIncome: d.summary.estimatedMonthlyIncome,
        verifiedMonthlyIncome: d.summary.verifiedMonthlyIncome,
        incomeConfidence: d.summary.incomeConfidence,
        totalBalance: d.summary.totalBalance,
        totalAvailable: d.summary.totalAvailable,
        accountCount: d.summary.accountCount,
        transactionCount: d.summary.transactionCount,
      },
      accounts: d.accounts,
      income: {
        total12Mo: d.income.total12Mo,
        total3Mo: d.income.total3Mo,
        monthlyEstimate: d.income.monthlyEstimate,
        verified: d.income.verified,
        other: d.income.other,
        recurringDeposits: d.income.recurringDeposits,
        allDeposits: d.income.allDeposits,
      },
      expenses: d.expenses,
      transactions: d.transactions,
      transactions3Mo: d.transactions3Mo || d.transactions,
      generatedAt: d.generatedAt,
    };
  }
  
  // Legacy format - convert to common format
  const d = data as LegacyReportData;
  const transactions = d.transactions.map(t => ({
    date: t.date,
    amount: t.amount,
    name: t.name,
    category: t.category || 'Uncategorized',
    pending: t.pending,
    isIncome: t.amount < 0,
    runningBalance: null as number | null,
    incomeType: undefined as string | undefined,
    isRecurringIncome: false,
  }));
  
  return {
    summary: {
      totalIncome12Mo: d.summary.total_income_3mo, // Legacy only has 3mo
      totalIncome3Mo: d.summary.total_income_3mo,
      estimatedMonthlyIncome: d.summary.estimated_monthly_income,
      verifiedMonthlyIncome: d.summary.estimated_monthly_income, // Legacy doesn't have verified
      incomeConfidence: 'low' as const,
      totalBalance: d.summary.total_balance,
      totalAvailable: d.summary.total_available,
      accountCount: d.summary.account_count,
      transactionCount: d.summary.transaction_count,
    },
    accounts: d.accounts.map(a => ({
      name: a.name,
      officialName: a.official_name,
      type: a.type,
      subtype: a.subtype,
      currentBalance: a.current_balance,
      availableBalance: a.available_balance,
      mask: a.mask,
    })),
    income: {
      total12Mo: d.income.total_3mo,
      total3Mo: d.income.total_3mo,
      monthlyEstimate: d.income.monthly_estimate,
      verified: {
        total3Mo: d.income.total_3mo,
        monthlyEstimate: d.income.monthly_estimate,
        sources: [],
      },
      other: {
        total3Mo: 0,
        p2p: 0,
        transfers: 0,
        refunds: 0,
      },
      recurringDeposits: d.income.recurring_deposits.map(r => ({
        approximateAmount: r.approximate_amount,
        occurrences: r.occurrences,
        dates: r.dates,
        likelySource: r.likely_source,
        incomeType: 'other' as const,
        confidence: 'low' as const,
        transactionIds: [],
      })),
      allDeposits: d.income.all_deposits.map(dep => ({
        date: dep.date,
        amount: dep.amount,
        name: dep.name,
        category: dep.category,
      })),
    },
    expenses: {
      total3Mo: d.expenses.total_3mo,
      byCategory: d.expenses.by_category,
    },
    transactions,
    transactions3Mo: transactions,
    generatedAt: d.generated_at,
  };
}

// Transaction History with Month Tabs
function TransactionHistory({ transactions }: { transactions: Array<{
  date: string;
  amount: number;
  name: string;
  category: string;
  pending: boolean;
  isIncome: boolean;
  runningBalance: number | null;
  incomeType?: string;
  /** True if INCOME + recurring (recurring tab). */
  isRecurringIncome?: boolean;
}> }) {
  const [filter, setFilter] = useState<'credits' | 'payroll'>('credits');
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  // Calculate both datasets upfront for print sections
  const allIncomeTransactions = useMemo(() => 
    transactions.filter(t => t.isIncome)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions]
  );

  const recurringIncomeTransactions = useMemo(() =>
    transactions.filter(t => t.isIncome && 
      (t.incomeType === 'payroll' || t.incomeType === 'government'))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions]
  );

  const filteredAndSorted = useMemo(() => {
    const filtered = filter === 'payroll'
      ? recurringIncomeTransactions
      : allIncomeTransactions;
    return filtered;
  }, [allIncomeTransactions, recurringIncomeTransactions, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return filteredAndSorted.slice(start, start + PER_PAGE);
  }, [filteredAndSorted, currentPage]);

  const start = (currentPage - 1) * PER_PAGE;
  const end = Math.min(start + PER_PAGE, filteredAndSorted.length);

  // Helper function to render transaction rows
  const renderTransactionRows = (txns: typeof transactions) => {
    if (txns.length === 0) {
      return (
        <div className="px-3 sm:px-5 py-8 text-center text-gray-500">
          No incoming deposits found.
        </div>
      );
    }

    return txns.map((txn, i) => (
      <React.Fragment key={i}>
        {/* Mobile Card View */}
        <div 
          className={`sm:hidden px-3 py-3 border-b border-gray-100 text-sm print-table-row ${txn.pending ? 'opacity-60' : ''}`}
        >
          <div className="flex justify-between items-start mb-1">
            <div className="text-emerald-600 text-xs font-medium">
              {new Date(txn.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
            </div>
            <div className="text-right">
              {txn.isIncome ? (
                <div className="text-emerald-600 font-medium">{formatCurrency(txn.amount)}</div>
              ) : (
                <div className="text-gray-900 font-medium">{formatCurrency(txn.amount)}</div>
              )}
            </div>
          </div>
          <div className="text-gray-900 truncate cursor-help" title={txn.name}>
            {txn.name}
            {txn.pending && <span className="ml-2 text-xs text-amber-600">(pending)</span>}
          </div>
        </div>
        {/* Desktop Grid View */}
        <div 
          className={`hidden sm:grid grid-cols-8 gap-2 sm:gap-4 px-3 sm:px-5 py-3 border-b border-gray-100 text-sm print-table-row ${txn.pending ? 'opacity-60' : ''}`}
        >
          <div className="col-span-2 text-emerald-600 text-xs">
            {new Date(txn.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
          </div>
          <div className="col-span-4 text-gray-900 truncate cursor-help text-xs sm:text-sm" title={txn.name}>
            {txn.name}
            {txn.pending && <span className="ml-2 text-xs text-amber-600">(pending)</span>}
          </div>
          <div className="col-span-2 text-right text-emerald-600 text-xs sm:text-sm whitespace-nowrap">
            {txn.isIncome && formatCurrency(txn.amount)}
          </div>
        </div>
      </React.Fragment>
    ));
  };

  return (
    <>
      {/* Interactive Section - Hidden in Print */}
      <div className="bg-white border border-gray-200 rounded mb-6 print:hidden">
        <div className="px-5 py-3 border-b border-gray-200">
          <div className="font-semibold text-gray-900">Other Incoming Deposits</div>
          <p className="text-gray-500 text-sm mt-1">
            Incoming deposits authorized by the applicant that were not identified as recurring income. These may include peer-to-peer transfers or irregular payments.
          </p>
        </div>
        
        {/* Filter + Pagination */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show:</span>
            <button
              onClick={() => { setFilter('credits'); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                filter === 'credits'
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              Incoming Deposits
            </button>
            <button
              onClick={() => { setFilter('payroll'); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                filter === 'payroll'
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              Recurring Income
            </button>
          </div>
          {filteredAndSorted.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Showing {start + 1}–{end} of {filteredAndSorted.length}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-1.5">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Table Header */}
        {filteredAndSorted.length > 0 && (
          <div className="hidden sm:grid grid-cols-8 gap-2 sm:gap-4 px-3 sm:px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600">
            <div className="col-span-2">Date</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-2 text-right">Credit</div>
          </div>
        )}
        
        {/* Table Rows or Empty State */}
        <div className="max-h-[1000px] overflow-y-auto">
          {paginated.length === 0 ? (
            <div className="px-3 sm:px-5 py-8 text-center text-gray-500">
              {filter === 'payroll' 
                ? 'No deposits identified as recurring income patterns.'
                : 'No incoming deposits found.'}
            </div>
          ) : (
            renderTransactionRows(paginated)
          )}
        </div>
      </div>

      {/* Print-Only Sections */}
      {/* Section 1: Incoming Deposits (All Income) */}
      <div className="hidden print:block bg-white border border-gray-200 rounded mb-6 print-keep-together">
        <div className="px-5 py-3 border-b border-gray-200 print-keep-header-with-content">
          <div className="font-semibold text-gray-900">Incoming Deposits</div>
          <p className="text-gray-500 text-sm mt-1">
            All incoming deposits authorized by the applicant.
          </p>
        </div>
        
        {/* Table Header */}
        {allIncomeTransactions.length > 0 && (
          <div className="hidden sm:grid grid-cols-8 gap-2 sm:gap-4 px-3 sm:px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 print-keep-header-with-content">
            <div className="col-span-2">Date</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-2 text-right">Credit</div>
          </div>
        )}
        
        {/* Table Rows */}
        <div>
          {renderTransactionRows(allIncomeTransactions)}
        </div>
      </div>

      {/* Section 2: Recurring Income (Payroll/Government Only) */}
      <div className="hidden print:block bg-white border border-gray-200 rounded mb-6 print-keep-together">
        <div className="px-5 py-3 border-b border-gray-200 print-keep-header-with-content">
          <div className="font-semibold text-gray-900">Recurring Income</div>
          <p className="text-gray-500 text-sm mt-1">
            Deposits identified as recurring income patterns (payroll or government payments).
          </p>
        </div>
        
        {/* Table Header */}
        {recurringIncomeTransactions.length > 0 && (
          <div className="hidden sm:grid grid-cols-8 gap-2 sm:gap-4 px-3 sm:px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 print-keep-header-with-content">
            <div className="col-span-2">Date</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-2 text-right">Credit</div>
          </div>
        )}
        
        {/* Table Rows */}
        <div>
          {recurringIncomeTransactions.length === 0 ? (
            <div className="px-3 sm:px-5 py-8 text-center text-gray-500">
              No deposits identified as recurring income patterns.
            </div>
          ) : (
            renderTransactionRows(recurringIncomeTransactions)
          )}
        </div>
      </div>
    </>
  );
}

// Confidence badge component
function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-red-100 text-red-700 border-red-200',
  };
  const labels = {
    high: 'High Confidence',
    medium: 'Medium Confidence',
    low: 'Low Confidence',
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${styles[confidence]}`}>
      {labels[confidence]}
    </span>
  );
}

// Income type badge component
function IncomeTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    payroll: 'bg-emerald-100 text-emerald-700',
    government: 'bg-blue-100 text-blue-700',
    p2p: 'bg-purple-100 text-purple-700',
    transfer: 'bg-gray-100 text-gray-600',
    refund: 'bg-orange-100 text-orange-700',
    other: 'bg-gray-100 text-gray-600',
  };
  const labels: Record<string, string> = {
    payroll: 'Recurring Income',
    government: 'Government',
    p2p: 'P2P',
    transfer: 'Transfer',
    refund: 'Refund',
    other: 'Other',
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${styles[type] || styles.other}`}>
      {labels[type] || 'Other'}
    </span>
  );
}

export default function ReportContent({ verification, reportData, isCalculated }: Props) {
  const data = normalizeReportData(reportData);
  const { summary, income, transactions, accounts } = data;
  
  const PAYROLL_KEYWORDS = [
    'payroll', 'salary', 'direct dep', 'dir dep', 'paycheck',
    'adp', 'gusto', 'paychex', 'workday', 'ceridian', 'paylocity',
    'paycor', 'bamboohr', 'namely', 'rippling', 'justworks',
    'quickbooks payroll', 'square payroll', 'intuit', 'wage',
    'employer', 'compensation', 'net pay', 'gross pay',
    'ach payment', 'ach credit', 'ach deposit', 'direct deposit',
    'techcorp solutions', 'acme corporation'
  ];
  const EXCLUDE_KEYWORDS = [
    'venmo', 'zelle', 'cash app', 'cashapp', 'paypal', 'apple cash',
    'google pay', 'gpay', 'square cash', 'transfer', 'xfer',
    'savings', 'checking', '360 performance', 'money market',
    'brokerage', 'investment', 'refund', 'return', 'rebate',
    'wise', 'remitly', 'western union', 'moneygram'
  ];
  const isPayrollByName = (name: string) => {
    const lower = name.toLowerCase();
    if (EXCLUDE_KEYWORDS.some(kw => lower.includes(kw))) return false;
    return PAYROLL_KEYWORDS.some(kw => lower.includes(kw));
  };
  type Txn = { isIncome: boolean; name: string; incomeType?: string; date: string; amount: number };
  const isPayrollTxn = (t: Txn) =>
    t.incomeType === 'payroll' || t.incomeType === 'government'
      ? true
      : t.incomeType != null
        ? false
        : isPayrollByName(t.name);

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const payrollTransactions12Mo = transactions.filter(t => t.isIncome && isPayrollTxn(t));
  const historicalAnnual = payrollTransactions12Mo.reduce((sum, t) => sum + t.amount, 0);
  const historicalMonthly = historicalAnnual / 12;

  const payrollDeposits3Mo = transactions.filter(t =>
    t.isIncome && isPayrollTxn(t) && new Date(t.date) >= threeMonthsAgo
  );
  const projectedTotal3Mo = payrollDeposits3Mo.reduce((sum, t) => sum + t.amount, 0);
  const projectedMonthly = projectedTotal3Mo / 3;
  const projectedAnnual = projectedMonthly * 12;
  
  // Payroll deposit counts for display
  const payrollDepositCount = payrollDeposits3Mo.length;
  const payrollTotalAmount = projectedTotal3Mo;
  
  // Get primary source name (most common payroll source)
  const sourceNameCounts: Record<string, { count: number; total: number }> = {};
  payrollDeposits3Mo.forEach(t => {
    const key = t.name.toLowerCase().slice(0, 30);
    if (!sourceNameCounts[key]) sourceNameCounts[key] = { count: 0, total: 0 };
    sourceNameCounts[key].count++;
    sourceNameCounts[key].total += t.amount;
  });
  
  const topSourceEntry = Object.entries(sourceNameCounts)
    .sort((a, b) => b[1].total - a[1].total)[0];
  
  const primaryIncomeSource = topSourceEntry 
    ? payrollDeposits3Mo.find(t => t.name.toLowerCase().slice(0, 30) === topSourceEntry[0])?.name || 'Payroll'
    : (income.verified?.sources?.[0]?.likelySource || 'Not Detected');
  
  // Calculate totals for PRIMARY source only (not all payroll deposits)
  const primarySourceKey = topSourceEntry?.[0];
  const primarySourceDeposits = primarySourceKey
    ? payrollDeposits3Mo.filter(t => t.name.toLowerCase().slice(0, 30) === primarySourceKey)
    : [];
  
  const primarySourceTotal90Days = primarySourceDeposits.reduce((sum, t) => sum + t.amount, 0);
  const primarySourceOccurrences = primarySourceDeposits.length;

  // Calculate months of data and earliest transaction date
  const transactionDates = transactions
    .map(t => new Date(t.date))
    .filter(d => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  
  const earliestTransactionDate = transactionDates.length > 0 ? transactionDates[0] : null;
  const latestTransactionDate = transactionDates.length > 0 ? transactionDates[transactionDates.length - 1] : null;
  
  const monthsOfData = earliestTransactionDate && latestTransactionDate
    ? Math.max(1, Math.ceil((latestTransactionDate.getTime() - earliestTransactionDate.getTime()) / (1000 * 60 * 60 * 24 * 30)))
    : 0;
  const monthsDisplay = Math.min(monthsOfData, 12);

  return (
    <div className="min-h-screen bg-[#f5f5f5] print:bg-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Print Button - Hidden on Print */}
        <div className="flex justify-end mb-4 print:hidden">
            <button
              onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>

        {/* Report Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 h-[2px] bg-emerald-600"></div>
          <h1 className="text-emerald-600 text-xl font-semibold tracking-wide">INCOME VERIFICATION REPORT</h1>
          <div className="flex-1 h-[2px] bg-emerald-600"></div>
        </div>
        
      
        
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-6">
          <div className="flex gap-2">
            <span className="text-gray-500">Individual Name</span>
            <span className="font-medium text-gray-900">{verification.individual_name}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500">Requested By</span>
            <span className="font-medium text-gray-900">{verification.requested_by_name || 'N/A'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500">Purpose</span>
            <span className="font-medium text-gray-900">{verification.purpose || 'N/A'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500">Report Date</span>
            <span className="font-medium text-gray-900">{formatDate(verification.completed_at)}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500">Bank Account(s)</span>
            <span className="font-medium text-gray-900">
              {accounts.map((acc, idx) => (
                <span key={idx}>
                  {('institution' in acc && acc.institution) || acc.name}
                  {acc.mask && ` •••${acc.mask}`}
                  {idx < accounts.length - 1 && ', '}
                </span>
              ))}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500">Report ID</span>
            <span className="font-medium text-gray-900">0-{Date.parse(verification.completed_at).toString().slice(-8)}</span>
          </div>
        </div>

        {/* Disclaimer Box */}
        <div className="bg-[#FFF8E7] border border-[#E8DFC7] rounded p-4 mb-6 text-sm text-gray-700 leading-relaxed">
          <strong>Disclaimer:</strong> This IncomeChecker.com Report is provided for informational purposes only. It presents income-related data derived from bank account information voluntarily authorized by the individual. This report does not constitute a recommendation, approval, denial, or eligibility determination for any purpose. Any interpretation or use of this information is the sole responsibility of the recipient.
        </div>

        {/* Income Summary Section */}
        <div className="bg-white border border-gray-200 rounded mb-6 print-keep-together">
          <div className="px-5 py-3 border-b border-gray-200 print-keep-header-with-content">
            <span className="font-semibold text-gray-900">Income Summary</span>
            <span className="text-gray-500 text-sm ml-2">Provided by Plaid • {monthsDisplay} {monthsDisplay === 1 ? 'month' : 'months'} of transaction data available</span>
              </div>

          <div className="p-5">
            {/* Bank Account Owner */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-gray-700">Bank Account Owner Name(s): <strong>{verification.individual_name}</strong></span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-black text-white text-xs font-medium rounded-full">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              {monthsOfData >= 12 && (
                <>
                  Historical income values are estimated using the individual's income from the past twelve (12) complete calendar months.<br/>
                </>
              )}
              Projected income values are estimated using the individual's income from the past three (3) complete calendar months.
            </p>

            {monthsOfData < 12 && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-6">
                Only {monthsOfData} {monthsOfData === 1 ? 'month' : 'months'} of transaction data {monthsOfData === 1 ? 'was' : 'were'} available from the bank. A 12‑month historical estimate is not shown.
              </p>
            )}

            {/* Projected & Historical Cards - Side by Side (Historical hidden when &lt; 12 months) */}
            <div className={`grid grid-cols-1 gap-4 ${monthsOfData >= 12 ? 'md:grid-cols-2 print:grid-cols-2' : ''}`}>
              {/* Projected Card */}
              <div className="bg-white border-4 border-emerald-200 rounded p-6 print-keep-together">
                <div className="mb-4">
                  <span className="text-5xl font-light text-emerald-600">{formatCurrency(projectedAnnual)}</span>
                  <div className="text-gray-600 mt-1">
                    <span className="text-sm font-medium">Projected Data</span><br/>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Annual</span>
                    <span className="font-medium text-gray-900">{formatCurrency(projectedAnnual)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Monthly</span>
                    <span className="font-medium text-gray-900">{formatCurrency(projectedMonthly)}</span>
                  </div>
                </div>
              </div>

              {/* Historical Card - only when 12+ months of data */}
              {monthsOfData >= 12 && (
                <div className="bg-white border-2 border-emerald-200 rounded p-6 print-keep-together">
                  <div className="mb-4">
                    <span className="text-5xl font-light text-emerald-600">{formatCurrency(historicalAnnual)}</span>
                    <div className="text-gray-600 mt-1">
                      <span className="text-sm font-medium">Historical Data</span><br/>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimated Annual</span>
                      <span className="font-medium text-gray-900">{formatCurrency(historicalAnnual)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimated Monthly</span>
                      <span className="font-medium text-gray-900">{formatCurrency(historicalMonthly)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Illustrative Monthly Capacity & Primary Income Source - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 mb-6">
          {/* Illustrative Monthly Capacity */}
          <div className="bg-white border border-gray-200 rounded p-5 print-keep-together">
            <h3 className="font-semibold text-gray-900 mb-3">Illustrative Monthly Capacity</h3>
            <div>
              <div className="text-emerald-600 text-5xl font-light mb-2">
                {formatCurrency(projectedMonthly / 3)}
              </div>
              <p className="text-xs text-gray-500">({formatCurrency(projectedMonthly)} ÷ 3)</p>
            </div>
          </div>

          {/* Primary Income Source */}
          <div className="bg-white border border-gray-200 rounded p-5 print-keep-together">
            <h3 className="font-semibold text-gray-900 mb-3">Primary Income Source</h3>
            {primarySourceOccurrences > 0 ? (
              <>
                <div className="text-emerald-600 text-xl font-medium mb-4 line-clamp-2">{primaryIncomeSource}</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total (Last 90 Days)</span>
                    <span className="font-medium text-gray-900">{formatCurrency(primarySourceTotal90Days)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600"></span>
                    <span className="font-medium text-gray-900">{primarySourceOccurrences} deposits</span>
                  </div>
                </div>
              </>
            ) : (
                <p className="text-gray-500 text-sm">No Deposits Identified as Recurring Income Patterns</p>
            )}
          </div>
        </div>

        {/* Recent Payroll Deposits */}
        <div className="bg-white border border-gray-200 rounded mb-6 print-keep-together">
          <div className="px-5 py-3 border-b border-gray-200 print-keep-header-with-content">
            <span className="font-semibold text-gray-900">Recent Deposits Identified as Recurring Income Patterns</span>
            <span className="text-gray-500 text-sm ml-2">(Last 90 Days)</span>  
          </div>
          
          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-10 gap-2 sm:gap-4 px-3 sm:px-5 py-3 border-b border-gray-200 text-xs font-semibold text-gray-600 print-keep-header-with-content">
            <div className="col-span-2">Pay Date</div>
            <div className="col-span-4">Source</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-2 text-right">Running Total</div>
          </div>
          
          {/* Payroll Deposit Rows */}
          {(() => {
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            const isPayrollDeposit = (d: { name: string; incomeType?: string }) =>
              d.incomeType === 'payroll' || d.incomeType === 'government'
                ? true
                : d.incomeType != null
                  ? false
                  : isPayrollByName(d.name);
            const payrollDeposits = income.allDeposits
              .filter(d => {
                const depositDate = new Date(d.date);
                return isPayrollDeposit(d) && depositDate >= threeMonthsAgo;
              })
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            if (payrollDeposits.length === 0) {
              return (
                <div className="px-3 sm:px-5 py-8 text-center text-gray-500">
                    No Deposits Identified as Recurring Income Patterns. Income may come from other sources.
                </div>
              );
            }
            
            let runningTotal = 0;
            // Calculate running total from oldest to newest, then reverse for display
            const depositsWithTotal = payrollDeposits.slice().reverse().map(d => {
              runningTotal += d.amount;
              return { ...d, runningTotal };
            }).reverse();
            
            return depositsWithTotal.map((deposit, i) => (
              <React.Fragment key={i}>
                {/* Mobile Card View */}
                <div 
                  className="sm:hidden px-3 py-3 border-b border-gray-100 text-sm print-table-row"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-emerald-600 text-xs font-medium">
                      {new Date(deposit.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-600 font-medium">{formatCurrency(deposit.amount)}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Total: {formatCurrency(deposit.runningTotal)}</div>
                    </div>
                  </div>
                  <div className="text-gray-900 truncate cursor-help mt-1" title={deposit.name}>
                    {deposit.name}
                  </div>
                </div>
                {/* Desktop Grid View */}
                <div 
                  className="hidden sm:grid grid-cols-10 gap-2 sm:gap-4 px-3 sm:px-5 py-3 border-b border-gray-100 text-sm print-table-row"
                >
                  <div className="col-span-2 text-emerald-600 text-xs">
                    {new Date(deposit.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                  </div>
                  <div className="col-span-4 text-gray-900 truncate cursor-help text-xs sm:text-sm" title={deposit.name}>
                    {deposit.name}
                  </div>
                  <div className="col-span-2 text-right text-gray-900 font-medium text-xs sm:text-sm whitespace-nowrap">
                    {formatCurrency(deposit.amount)}
                  </div>
                  <div className="col-span-2 text-right text-gray-500 text-xs sm:text-sm whitespace-nowrap">
                    {formatCurrency(deposit.runningTotal)}
                  </div>
                </div>
              </React.Fragment>
            ));
          })()}
        </div>

        {/* Transaction Ledger with Month Tabs */}
        <TransactionHistory transactions={transactions} />

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mt-8 pt-6 border-t border-gray-300">
          <p className="mb-2">
          This report was generated based on consumer-authorized transaction data. Recipients should use this for informational review only.          </p>
          <p className="mb-2">
            Report generated {formatDate(data.generatedAt)} • Verification for {verification.requested_by_name || verification.individual_email}
          </p>
          <p>
            <a href="/disclaimers" className="text-emerald-600 hover:underline">See full disclaimers and limitations</a>
          </p>
        </div>
      </div>
    </div>
  );
}
