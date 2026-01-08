'use client';

import { 
  DollarSign, 
  TrendingUp, 
  Wallet, 
  CreditCard, 
  ArrowDownLeft, 
  ArrowUpRight,
  Building2,
  CheckCircle,
  Download,
  PiggyBank,
  Receipt,
  ArrowLeft
} from 'lucide-react';
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
    applicant_name: string;
    applicant_email: string;
    landlord_name?: string | null;
    property_unit?: string | null;
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
        totalIncome3Mo: d.summary.totalIncome3Mo,
        estimatedMonthlyIncome: d.summary.estimatedMonthlyIncome,
        totalBalance: d.summary.totalBalance,
        totalAvailable: d.summary.totalAvailable,
        accountCount: d.summary.accountCount,
        transactionCount: d.summary.transactionCount,
      },
      accounts: d.accounts,
      income: {
        total3Mo: d.income.total3Mo,
        monthlyEstimate: d.income.monthlyEstimate,
        recurringDeposits: d.income.recurringDeposits,
        allDeposits: d.income.allDeposits,
      },
      expenses: d.expenses,
      transactions: d.transactions,
      generatedAt: d.generatedAt,
    };
  }
  
  // Legacy format - convert to common format
  const d = data as LegacyReportData;
  return {
    summary: {
      totalIncome3Mo: d.summary.total_income_3mo,
      estimatedMonthlyIncome: d.summary.estimated_monthly_income,
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
      total3Mo: d.income.total_3mo,
      monthlyEstimate: d.income.monthly_estimate,
      recurringDeposits: d.income.recurring_deposits.map(r => ({
        approximateAmount: r.approximate_amount,
        occurrences: r.occurrences,
        dates: r.dates,
        likelySource: r.likely_source,
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
    transactions: d.transactions.map(t => ({
      date: t.date,
      amount: t.amount,
      name: t.name,
      category: t.category || 'Uncategorized',
      pending: t.pending,
      isIncome: t.amount < 0,
    })),
    generatedAt: d.generated_at,
  };
}

export default function ReportContent({ verification, reportData, isCalculated }: Props) {
  const data = normalizeReportData(reportData);
  const { summary, accounts, income, expenses, transactions } = data;
  const maxRentAffordable = summary.estimatedMonthlyIncome / 3;

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 print:hidden"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
                Verified
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Income Verification Report</h1>
            <p className="text-gray-500">Generated {formatDate(data.generatedAt)}</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Applicant & Landlord Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                {verification.applicant_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {verification.applicant_name}
                </h2>
                <p className="text-gray-500">{verification.applicant_email}</p>
              </div>
            </div>
            {verification.landlord_name && (
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Requested by</p>
                <p className="font-medium text-gray-900">{verification.landlord_name}</p>
                {verification.property_unit && (
                  <p className="text-sm text-gray-500">{verification.property_unit}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm text-gray-500">Monthly Income</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.estimatedMonthlyIncome)}</p>
            <p className="text-xs text-gray-400 mt-1">Estimated from 3-month data</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Total Balance</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalBalance)}</p>
            <p className="text-xs text-gray-400 mt-1">Across {summary.accountCount} accounts</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">3-Month Income</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalIncome3Mo)}</p>
            <p className="text-xs text-gray-400 mt-1">Total deposits received</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm text-gray-500">Max Rent (3x Rule)</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(maxRentAffordable)}</p>
            <p className="text-xs text-gray-400 mt-1">Based on 1/3 of income</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Bank Accounts */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  Bank Accounts
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {accounts.map((account, i) => (
                  <div key={i} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{account.name}</p>
                        <p className="text-sm text-gray-500">
                          {account.type} {account.subtype && `• ${account.subtype}`} 
                          {account.mask && ` •••• ${account.mask}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(account.currentBalance || 0)}</p>
                      {account.availableBalance !== null && account.availableBalance !== account.currentBalance && (
                        <p className="text-sm text-gray-500">{formatCurrency(account.availableBalance)} available</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recurring Income */}
            {income.recurringDeposits.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    Recurring Income Detected
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {income.recurringDeposits.map((deposit, i) => (
                    <div key={i} className="px-6 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900">{deposit.likelySource}</p>
                        <p className="text-emerald-600 font-semibold">~{formatCurrency(deposit.approximateAmount)}</p>
                      </div>
                      <p className="text-sm text-gray-500">{deposit.occurrences} occurrences in last 3 months</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-gray-400" />
                  Recent Transactions
                </h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="divide-y divide-gray-100">
                  {transactions.slice(0, 30).map((txn, i) => (
                    <div key={i} className="px-6 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${txn.amount < 0 ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                          {txn.amount < 0 ? <ArrowDownLeft className="w-4 h-4 text-emerald-600" /> : <ArrowUpRight className="w-4 h-4 text-gray-500" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{txn.name}</p>
                          <p className="text-xs text-gray-500">{formatDate(txn.date)}{txn.category && ` • ${txn.category}`}</p>
                        </div>
                      </div>
                      <p className={`font-medium ${txn.amount < 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                        {txn.amount < 0 ? '+' : '-'}{formatCurrency(Math.abs(txn.amount))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Spending by Category */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Spending by Category</h3>
                <p className="text-sm text-gray-500">Last 3 months</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {expenses.byCategory.slice(0, 8).map((cat, i) => {
                    const percentage = (cat.amount / expenses.total3Mo) * 100;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">{cat.category}</span>
                          <span className="text-gray-900 font-medium">{formatCurrency(cat.amount)}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(percentage, 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Total Spending</span>
                    <span className="text-xl font-bold text-gray-900">{formatCurrency(expenses.total3Mo)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Income Deposits */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
                  Income Deposits
                </h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <div className="divide-y divide-gray-100">
                  {income.allDeposits.slice(0, 15).map((deposit, i) => (
                    <div key={i} className="px-6 py-3">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{deposit.name}</p>
                          <p className="text-xs text-gray-500">{formatDate(deposit.date)}</p>
                        </div>
                        <p className="text-emerald-600 font-medium ml-4">+{formatCurrency(deposit.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>Report generated via Plaid • Data reflects account status as of {formatDate(data.generatedAt)}</p>
            <p>Verification for {verification.applicant_email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
