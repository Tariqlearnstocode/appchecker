'use client';

import { Download } from 'lucide-react';
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
  }));
  
  return {
    summary: {
      totalIncome12Mo: d.summary.total_income_3mo, // Legacy only has 3mo
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
      total12Mo: d.income.total_3mo,
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
    transactions,
    transactions3Mo: transactions,
    generatedAt: d.generated_at,
  };
}

export default function ReportContent({ verification, reportData, isCalculated }: Props) {
  const data = normalizeReportData(reportData);
  const { summary, income, transactions } = data;
  
  // Historical figures (based on actual 12-month data)
  const historicalAnnualGross = summary.totalIncome12Mo;
  const historicalAnnualNet = historicalAnnualGross * 0.73; // Approximate net after taxes
  const historicalMonthlyGross = historicalAnnualGross / 12;
  
  // Projected figures (based on 3-month data, extrapolated)
  const projectedAnnualGross = summary.estimatedMonthlyIncome * 12;
  const projectedAnnualNet = projectedAnnualGross * 0.73; // Approximate net after taxes
  const projectedMonthlyGross = summary.estimatedMonthlyIncome;
  
  // Get primary income source from recurring deposits
  const topRecurringDeposit = income.recurringDeposits.length > 0
    ? income.recurringDeposits.sort((a, b) => (b.approximateAmount * b.occurrences) - (a.approximateAmount * a.occurrences))[0]
    : null;
  const primaryIncomeSource = topRecurringDeposit?.likelySource || 'Not Detected';
  const primarySourceTotal90Days = topRecurringDeposit 
    ? topRecurringDeposit.approximateAmount * topRecurringDeposit.occurrences 
    : 0;
  const primarySourceMonthlyEst = topRecurringDeposit 
    ? primarySourceTotal90Days / 3 
    : 0;
  
  // Income to rent ratio calculation (using projected/recent income)
  const monthlyRent = verification.monthly_rent || 0;
  const incomeToRentRatio = monthlyRent > 0 ? projectedMonthlyGross / monthlyRent : 0;

  return (
    <div className="min-h-screen bg-[#f5f5f5] print:bg-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Print Button - Hidden on Print */}
        <div className="flex justify-end mb-4 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-[#00969B] hover:bg-[#007a7e] text-white rounded transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-[2px] bg-[#00969B]"></div>
          <h1 className="text-[#00969B] text-xl font-semibold tracking-wide">REPORT DETAILS</h1>
          <div className="flex-1 h-[2px] bg-[#00969B]"></div>
        </div>

        {/* Disclaimer Box */}
        <div className="bg-[#FFF8E7] border border-[#E8DFC7] rounded p-4 mb-6 text-sm text-gray-700 leading-relaxed">
          <strong>Disclaimer:</strong> This report is based on income data directly reported by the applicant's financial institution(s). The applicant has made available all the data used to compile this report by connecting to their financial institutions. It may not reflect the applicant's entire income or all of their financial institutions. If deposits are not regularly made to the applicant's provided bank account(s), the amounts may not be recognized as income.
        </div>

        {/* Income Summary Section */}
        <div className="bg-white border border-gray-200 rounded mb-6">
          <div className="px-5 py-3 border-b border-gray-200">
            <span className="font-semibold text-gray-900">Income Summary</span>
            <span className="text-gray-500 text-sm ml-2">Provided by Teller</span>
          </div>
          
          <div className="p-5">
            {/* Bank Account Owner */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-gray-700">Bank Account Owner Name(s): <strong>{verification.applicant_name}</strong></span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#00969B] text-white text-xs font-medium rounded-full">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              Historical income values are estimated using the applicant's gross and net income from the past twelve (12) complete calendar months.<br/>
              Projected income values are estimated using the applicant's gross and net income from the past three (3) complete calendar months.
            </p>

            {/* Historical & Projected Cards - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Historical Annual Card */}
              <div className="bg-white border border-gray-200 rounded p-6">
                <div className="mb-4">
                  <span className="text-5xl font-light text-[#00969B]">{formatCurrency(historicalAnnualGross)}</span>
                  <div className="text-gray-600 mt-1">
                    <span className="text-sm">Historical</span><br/>
                    <span className="text-sm font-medium">Estimated Annual (Gross)</span>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Annual (Gross)</span>
                    <span className="font-medium text-gray-900">{formatCurrency(historicalAnnualGross)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Annual (Net)</span>
                    <span className="font-medium text-gray-900">{formatCurrency(historicalAnnualNet)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Monthly (Gross)</span>
                    <span className="font-medium text-gray-900">{formatCurrency(historicalMonthlyGross)}</span>
                  </div>
                </div>
              </div>

              {/* Projected Annual Card */}
              <div className="bg-white border border-gray-200 rounded p-6">
                <div className="mb-4">
                  <span className="text-5xl font-light text-[#00969B]">{formatCurrency(projectedAnnualGross)}</span>
                  <div className="text-gray-600 mt-1">
                    <span className="text-sm">Projected</span><br/>
                    <span className="text-sm font-medium">Estimated Annual (Gross)</span>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Annual (Gross)</span>
                    <span className="font-medium text-gray-900">{formatCurrency(projectedAnnualGross)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Annual (Net)</span>
                    <span className="font-medium text-gray-900">{formatCurrency(projectedAnnualNet)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#00969B] font-medium">Estimated Monthly (Gross)</span>
                    <span className="font-medium text-[#00969B]">{formatCurrency(projectedMonthlyGross)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Income to Rent Ratio & Primary Income Source - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Income to Rent Ratio */}
          <div className="bg-white border border-gray-200 rounded p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Income to Rent Ratio</h3>
            {monthlyRent > 0 ? (
              <>
                <div className="text-[#00969B] text-2xl font-light mb-2">
                  {formatCurrency(projectedMonthlyGross)} / {formatCurrency(monthlyRent)} = <strong>{incomeToRentRatio.toFixed(2)}</strong>
                </div>
                <p className="text-xs text-gray-500">(Estimated Monthly Gross Income / Monthly Rent)</p>
              </>
            ) : (
              <p className="text-gray-500 text-sm">Monthly rent not provided</p>
            )}
          </div>

          {/* Primary Income Source */}
          <div className="bg-white border border-gray-200 rounded p-5">
            <div className="flex items-baseline gap-2 mb-4">
              <h3 className="font-semibold text-gray-900">Primary Income Source</h3>
              <span className="text-gray-500 text-xs">Provided by Teller</span>
            </div>
            <div className="text-[#00969B] text-xl font-medium mb-3">
              {primaryIncomeSource}
            </div>
            {topRecurringDeposit && (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total (Last 90 Days)</span>
                  <span className="font-medium text-gray-900">{formatCurrency(primarySourceTotal90Days)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Est. Monthly Income</span>
                  <span className="font-medium text-gray-900">{formatCurrency(primarySourceMonthlyEst)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Deposits */}
        <div className="bg-white border border-gray-200 rounded mb-6">
          <div className="px-5 py-3 border-b border-gray-200">
            <span className="font-semibold text-gray-900">Recent Deposits</span>
            <span className="text-gray-500 text-sm ml-2">Provided by Teller</span>
          </div>
          
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-gray-200 text-xs font-semibold text-gray-600">
            <div className="col-span-2">Pay Date</div>
            <div className="col-span-5">Description</div>
            <div className="col-span-2 text-right">Earnings (Net)</div>
            <div className="col-span-3 text-right">3-Month Total</div>
          </div>
          
          {/* Deposit Rows */}
          {(() => {
            const deposits = income.allDeposits.slice().sort((a, b) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            let runningTotal = income.total3Mo;
            
            return deposits.map((deposit, i) => {
              const total = runningTotal;
              runningTotal -= deposit.amount;
              
              return (
                <div 
                  key={i} 
                  className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-gray-100 text-sm"
                >
                  <div className="col-span-2 text-[#00969B]">
                    {new Date(deposit.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                  </div>
                  <div className="col-span-5 text-[#00969B] truncate">
                    {deposit.name}
                  </div>
                  <div className="col-span-2 text-right text-gray-900">
                    {formatCurrency(deposit.amount)}
                  </div>
                  <div className="col-span-3 text-right text-gray-900">
                    {formatCurrency(total)}
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {/* Transaction Ledger */}
        <div className="bg-white border border-gray-200 rounded mb-6">
          <div className="px-5 py-3 border-b border-gray-200">
            <span className="font-semibold text-gray-900">Transaction History</span>
            <span className="text-gray-500 text-sm ml-2">Provided by Teller • Last 12 Months</span>
          </div>
          
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600">
            <div className="col-span-2">Date</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-2 text-right">Debit</div>
            <div className="col-span-2 text-right">Credit</div>
            <div className="col-span-2 text-right">Balance</div>
          </div>
          
          {/* Table Rows */}
          <div className="max-h-[500px] overflow-y-auto">
            {transactions.map((txn, i) => (
              <div 
                key={i} 
                className={`grid grid-cols-12 gap-4 px-5 py-3 border-b border-gray-100 text-sm ${txn.pending ? 'opacity-60' : ''}`}
              >
                <div className="col-span-2 text-[#00969B]">
                  {new Date(txn.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                </div>
                <div className="col-span-4 text-gray-900 truncate">
                  {txn.name}
                  {txn.pending && <span className="ml-2 text-xs text-amber-600">(pending)</span>}
                </div>
                <div className="col-span-2 text-right text-gray-900">
                  {!txn.isIncome && formatCurrency(txn.amount)}
                </div>
                <div className="col-span-2 text-right text-gray-900">
                  {txn.isIncome && formatCurrency(txn.amount)}
                </div>
                <div className="col-span-2 text-right text-gray-500">
                  {txn.runningBalance !== null ? formatCurrency(txn.runningBalance) : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mt-8 pt-6 border-t border-gray-300">
          <p className="mb-2">
            This report is confidential and is not to be discussed except for persons who have permissible purposes as defined in the Fair Credit Reporting Act and other applicable Federal and State regulations.
          </p>
          <p className="mb-1">
            Report generated {formatDate(data.generatedAt)} • Verification for {verification.applicant_email}
          </p>
        </div>
      </div>
    </div>
  );
}
