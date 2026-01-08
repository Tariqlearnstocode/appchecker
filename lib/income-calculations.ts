/**
 * Income calculation utilities
 * These functions take raw Plaid data and compute useful metrics
 * Calculations are done at display time, not stored
 */

export interface RawPlaidData {
  accounts: PlaidAccount[];
  transactions: PlaidTransaction[];
  item?: any;
  total_transactions?: number;
  fetched_at: string;
  date_range: {
    start: string;
    end: string;
  };
}

export interface PlaidAccount {
  account_id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  balances: {
    current: number | null;
    available: number | null;
    limit: number | null;
  };
}

export interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  amount: number; // Positive = money out, Negative = money in
  date: string;
  name: string;
  merchant_name?: string | null;
  category?: string[] | null;
  pending: boolean;
}

export interface IncomeReport {
  summary: {
    totalIncome3Mo: number;
    estimatedMonthlyIncome: number;
    totalBalance: number;
    totalAvailable: number;
    accountCount: number;
    transactionCount: number;
    incomeTransactionCount: number;
  };
  accounts: AccountSummary[];
  income: {
    total3Mo: number;
    monthlyEstimate: number;
    recurringDeposits: RecurringDeposit[];
    allDeposits: Deposit[];
  };
  expenses: {
    total3Mo: number;
    byCategory: CategoryTotal[];
  };
  transactions: TransactionDisplay[];
  generatedAt: string;
}

export interface AccountSummary {
  name: string;
  officialName: string | null;
  type: string;
  subtype: string | null;
  currentBalance: number | null;
  availableBalance: number | null;
  mask: string | null;
}

export interface RecurringDeposit {
  approximateAmount: number;
  occurrences: number;
  dates: string[];
  likelySource: string;
}

export interface Deposit {
  date: string;
  amount: number;
  name: string;
  category: string[] | null;
}

export interface CategoryTotal {
  category: string;
  amount: number;
}

export interface TransactionDisplay {
  date: string;
  amount: number;
  name: string;
  category: string;
  pending: boolean;
  isIncome: boolean;
}

/**
 * Calculate income report from raw Plaid data
 * This is the main function - call it when displaying the report
 */
export function calculateIncomeReport(rawData: RawPlaidData): IncomeReport {
  const { accounts, transactions } = rawData;

  // In Plaid: negative amount = money coming IN (deposits)
  const incomeTransactions = transactions.filter((t) => t.amount < 0 && !t.pending);
  const expenseTransactions = transactions.filter((t) => t.amount > 0 && !t.pending);

  // Calculate totals
  const totalIncome3Mo = incomeTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalExpenses3Mo = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const estimatedMonthlyIncome = totalIncome3Mo / 3;

  // Account balances
  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balances.current || 0), 0);
  const totalAvailable = accounts.reduce((sum, acc) => sum + (acc.balances.available || 0), 0);

  // Find recurring deposits
  const recurringDeposits = identifyRecurringDeposits(incomeTransactions);

  // Categorize expenses
  const expensesByCategory = categorizeTransactions(expenseTransactions);

  return {
    summary: {
      totalIncome3Mo,
      estimatedMonthlyIncome,
      totalBalance,
      totalAvailable,
      accountCount: accounts.length,
      transactionCount: transactions.length,
      incomeTransactionCount: incomeTransactions.length,
    },
    accounts: accounts.map((acc) => ({
      name: acc.name,
      officialName: acc.official_name,
      type: acc.type,
      subtype: acc.subtype,
      currentBalance: acc.balances.current,
      availableBalance: acc.balances.available,
      mask: acc.mask,
    })),
    income: {
      total3Mo: totalIncome3Mo,
      monthlyEstimate: estimatedMonthlyIncome,
      recurringDeposits,
      allDeposits: incomeTransactions.map((t) => ({
        date: t.date,
        amount: Math.abs(t.amount),
        name: t.merchant_name || t.name,
        category: t.category || null,
      })),
    },
    expenses: {
      total3Mo: totalExpenses3Mo,
      byCategory: expensesByCategory,
    },
    transactions: transactions.slice(0, 100).map((t) => ({
      date: t.date,
      amount: t.amount,
      name: t.merchant_name || t.name,
      category: t.category?.join(', ') || 'Uncategorized',
      pending: t.pending,
      isIncome: t.amount < 0,
    })),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Identify recurring deposits (potential paychecks)
 * Groups deposits by similar amounts and looks for patterns
 */
function identifyRecurringDeposits(incomeTransactions: PlaidTransaction[]): RecurringDeposit[] {
  // Group by approximate amount (within $50)
  const groups: Record<string, PlaidTransaction[]> = {};

  incomeTransactions.forEach((t) => {
    const amount = Math.abs(t.amount);
    // Round to nearest $50 for grouping similar amounts
    const key = Math.round(amount / 50) * 50;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  // Find groups with 2+ transactions (potentially recurring)
  const recurring = Object.entries(groups)
    .filter(([_, txns]) => txns.length >= 2)
    .map(([amount, txns]) => {
      // Calculate actual average amount
      const avgAmount = txns.reduce((sum, t) => sum + Math.abs(t.amount), 0) / txns.length;
      
      return {
        approximateAmount: avgAmount,
        occurrences: txns.length,
        dates: txns.map((t) => t.date).sort(),
        likelySource: txns[0]?.merchant_name || txns[0]?.name || 'Unknown',
      };
    })
    .sort((a, b) => b.approximateAmount - a.approximateAmount); // Sort by amount descending

  return recurring;
}

/**
 * Categorize transactions by Plaid category
 */
function categorizeTransactions(transactions: PlaidTransaction[]): CategoryTotal[] {
  const categories: Record<string, number> = {};

  transactions.forEach((t) => {
    const category = t.category?.[0] || 'Other';
    categories[category] = (categories[category] || 0) + t.amount;
  });

  return Object.entries(categories)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => ({ category, amount }));
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

