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
  Receipt
} from 'lucide-react';

interface ReportData {
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
    created_at: string;
    completed_at: string;
  };
  reportData: ReportData;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ReportContent({ verification, reportData }: Props) {
  const { summary, accounts, income, expenses, transactions } = reportData;
  const maxRentAffordable = summary.estimated_monthly_income / 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 print:bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-sm font-medium rounded-full">
                Verified
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">Income Verification Report</h1>
            <p className="text-zinc-400">Generated {formatDate(reportData.generated_at)}</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Applicant Info */}
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6 mb-8 print:bg-gray-50 print:border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
              {verification.applicant_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white print:text-gray-900">
                {verification.applicant_name}
              </h2>
              <p className="text-zinc-400 print:text-gray-600">{verification.applicant_email}</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-sm text-emerald-300">Monthly Income</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(summary.estimated_monthly_income)}</p>
            <p className="text-xs text-emerald-400/70 mt-1">Estimated from 3-month data</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-sm text-blue-300">Total Balance</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(summary.total_balance)}</p>
            <p className="text-xs text-blue-400/70 mt-1">Across {summary.account_count} accounts</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-sm text-purple-300">3-Month Income</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(summary.total_income_3mo)}</p>
            <p className="text-xs text-purple-400/70 mt-1">Total deposits received</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-sm text-amber-300">Max Rent (3x Rule)</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(maxRentAffordable)}</p>
            <p className="text-xs text-amber-400/70 mt-1">Based on 1/3 of income</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Bank Accounts */}
            <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-700/50">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-zinc-400" />
                  Bank Accounts
                </h3>
              </div>
              <div className="divide-y divide-zinc-700/50">
                {accounts.map((account, i) => (
                  <div key={i} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-zinc-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{account.name}</p>
                        <p className="text-sm text-zinc-500">
                          {account.type} {account.subtype && `• ${account.subtype}`} 
                          {account.mask && ` •••• ${account.mask}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">{formatCurrency(account.current_balance || 0)}</p>
                      {account.available_balance !== null && account.available_balance !== account.current_balance && (
                        <p className="text-sm text-zinc-500">{formatCurrency(account.available_balance)} available</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recurring Income */}
            {income.recurring_deposits.length > 0 && (
              <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-700/50">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    Recurring Income Detected
                  </h3>
                </div>
                <div className="divide-y divide-zinc-700/50">
                  {income.recurring_deposits.map((deposit, i) => (
                    <div key={i} className="px-6 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-white">{deposit.likely_source}</p>
                        <p className="text-emerald-400 font-semibold">~{formatCurrency(deposit.approximate_amount)}</p>
                      </div>
                      <p className="text-sm text-zinc-500">{deposit.occurrences} occurrences in last 3 months</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-700/50">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-zinc-400" />
                  Recent Transactions
                </h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="divide-y divide-zinc-700/50">
                  {transactions.slice(0, 30).map((txn, i) => (
                    <div key={i} className="px-6 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${txn.amount < 0 ? 'bg-emerald-500/10' : 'bg-zinc-700'}`}>
                          {txn.amount < 0 ? <ArrowDownLeft className="w-4 h-4 text-emerald-400" /> : <ArrowUpRight className="w-4 h-4 text-zinc-400" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white truncate max-w-[200px]">{txn.name}</p>
                          <p className="text-xs text-zinc-500">{formatDate(txn.date)}{txn.category && ` • ${txn.category}`}</p>
                        </div>
                      </div>
                      <p className={`font-medium ${txn.amount < 0 ? 'text-emerald-400' : 'text-white'}`}>
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
            <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-700/50">
                <h3 className="text-lg font-semibold text-white">Spending by Category</h3>
                <p className="text-sm text-zinc-500">Last 3 months</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {expenses.by_category.slice(0, 8).map((cat, i) => {
                    const percentage = (cat.amount / expenses.total_3mo) * 100;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-zinc-300">{cat.category}</span>
                          <span className="text-white font-medium">{formatCurrency(cat.amount)}</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{ width: `${Math.min(percentage, 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-700">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Total Spending</span>
                    <span className="text-xl font-bold text-white">{formatCurrency(expenses.total_3mo)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Income Deposits */}
            <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-700/50">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                  Income Deposits
                </h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <div className="divide-y divide-zinc-700/50">
                  {income.all_deposits.slice(0, 15).map((deposit, i) => (
                    <div key={i} className="px-6 py-3">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white truncate">{deposit.name}</p>
                          <p className="text-xs text-zinc-500">{formatDate(deposit.date)}</p>
                        </div>
                        <p className="text-emerald-400 font-medium ml-4">+{formatCurrency(deposit.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-zinc-700/50 print:border-gray-200">
          <div className="flex items-center justify-between text-sm text-zinc-500 print:text-gray-500">
            <p>Report generated via Plaid • Data reflects account status as of {formatDate(reportData.generated_at)}</p>
            <p>Verification ID: {verification.applicant_email.split('@')[0].slice(0, 8)}...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

