/**
 * Income calculation utilities
 * These functions take raw financial data (Plaid or Teller) and compute useful metrics
 * Calculations are done at display time, not stored
 */

// ============ RAW DATA TYPES ============

export interface RawFinancialData {
  accounts: any[];
  transactions: any[];
  fetched_at: string;
  date_range: {
    start: string;
    end: string;
  };
  provider?: 'plaid' | 'teller';
}

// ============ NORMALIZED TYPES ============

export interface NormalizedAccount {
  id: string;
  name: string;
  officialName: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  currentBalance: number | null;
  availableBalance: number | null;
  institution?: string;
}

export interface NormalizedTransaction {
  id: string;
  accountId: string;
  amount: number; // Always positive for income, negative for expenses
  date: string;
  name: string;
  category: string | null;
  pending: boolean;
  isIncome: boolean;
  runningBalance: number | null;
}

// ============ REPORT TYPES ============

export interface IncomeReport {
  summary: {
    totalIncome12Mo: number;
    totalIncome3Mo: number;
    estimatedMonthlyIncome: number;
    totalBalance: number;
    totalAvailable: number;
    accountCount: number;
    transactionCount: number;
    incomeTransactionCount: number;
  };
  accounts: NormalizedAccount[];
  income: {
    total12Mo: number;
    total3Mo: number;
    monthlyEstimate: number;
    recurringDeposits: RecurringDeposit[];
    allDeposits: Deposit[];
  };
  expenses: {
    total12Mo: number;
    total3Mo: number;
    byCategory: CategoryTotal[];
  };
  transactions: TransactionDisplay[];
  transactions3Mo: TransactionDisplay[];
  generatedAt: string;
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
  category: string | null;
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
  runningBalance: number | null;
}

// ============ NORMALIZATION FUNCTIONS ============

/**
 * Detect provider from raw data structure
 */
function detectProvider(rawData: RawFinancialData): 'plaid' | 'teller' {
  if (rawData.provider) return rawData.provider;
  
  // Teller accounts have 'enrollment_id' and 'last_four'
  if (rawData.accounts[0]?.enrollment_id || rawData.accounts[0]?.last_four) {
    return 'teller';
  }
  // Plaid accounts have 'account_id' and 'mask'
  return 'plaid';
}

/**
 * Normalize accounts from either provider
 */
function normalizeAccounts(accounts: any[], provider: 'plaid' | 'teller'): NormalizedAccount[] {
  if (provider === 'teller') {
    return accounts.map((acc) => ({
      id: acc.id,
      name: acc.name || 'Unknown Account',
      officialName: null,
      type: acc.type || 'depository',
      subtype: acc.subtype || null,
      mask: acc.last_four || null,
      currentBalance: acc.balances?.ledger ? parseFloat(acc.balances.ledger) : null,
      availableBalance: acc.balances?.available ? parseFloat(acc.balances.available) : null,
      institution: acc.institution?.name || null,
    }));
  }
  
  // Plaid format
  return accounts.map((acc) => ({
    id: acc.account_id,
    name: acc.name || 'Unknown Account',
    officialName: acc.official_name || null,
    type: acc.type || 'depository',
    subtype: acc.subtype || null,
    mask: acc.mask || null,
    currentBalance: acc.balances?.current ?? null,
    availableBalance: acc.balances?.available ?? null,
    institution: undefined,
  }));
}

/**
 * Normalize transactions from either provider
 */
function normalizeTransactions(transactions: any[], provider: 'plaid' | 'teller'): NormalizedTransaction[] {
  if (provider === 'teller') {
    return transactions.map((t) => {
      const amount = parseFloat(t.amount);
      // In Teller: positive amount = money IN (income/deposit), negative amount = money OUT (expense)
      // This is the OPPOSITE convention of Plaid!
      const isIncome = amount > 0;
      
      return {
        id: t.id,
        accountId: t.account_id,
        amount: Math.abs(amount),
        date: t.date,
        name: t.details?.counterparty?.name || t.description || 'Unknown',
        category: t.details?.category || null,
        pending: t.status === 'pending',
        isIncome,
        runningBalance: t.running_balance ? parseFloat(t.running_balance) : null,
      };
    });
  }
  
  // Plaid format
  return transactions.map((t) => {
    // In Plaid: positive amount = money out, negative amount = money in
    const isIncome = t.amount < 0;
    
    return {
      id: t.transaction_id,
      accountId: t.account_id,
      amount: Math.abs(t.amount),
      date: t.date,
      name: t.merchant_name || t.name || 'Unknown',
      category: t.category?.[0] || null,
      pending: t.pending || false,
      isIncome,
      runningBalance: null, // Plaid doesn't provide running balance in transactions
    };
  });
}

// ============ MAIN CALCULATION FUNCTION ============

/**
 * Calculate income report from raw financial data
 * Supports both Plaid and Teller data formats
 * Uses 12 months of data for annual calculations, 3 months for recent activity
 */
export function calculateIncomeReport(rawData: RawFinancialData): IncomeReport {
  const provider = detectProvider(rawData);
  
  // Normalize data to common format
  const accounts = normalizeAccounts(rawData.accounts, provider);
  const transactions = normalizeTransactions(rawData.transactions, provider);

  // Calculate date cutoffs
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // Filter transactions by time period
  const transactions3Mo = transactions.filter((t) => new Date(t.date) >= threeMonthsAgo);

  // Separate income and expenses (excluding pending) - full 12 months
  const incomeTransactions = transactions.filter((t) => t.isIncome && !t.pending);
  const expenseTransactions = transactions.filter((t) => !t.isIncome && !t.pending);

  // Separate income and expenses - last 3 months only
  const incomeTransactions3Mo = incomeTransactions.filter((t) => new Date(t.date) >= threeMonthsAgo);
  const expenseTransactions3Mo = expenseTransactions.filter((t) => new Date(t.date) >= threeMonthsAgo);

  // Calculate totals (12 months)
  const totalIncome12Mo = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses12Mo = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Calculate totals (3 months)
  const totalIncome3Mo = incomeTransactions3Mo.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses3Mo = expenseTransactions3Mo.reduce((sum, t) => sum + t.amount, 0);

  // Estimate monthly income from 3-month data (more accurate for recent changes)
  const estimatedMonthlyIncome = totalIncome3Mo / 3;

  // Account balances
  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
  const totalAvailable = accounts.reduce((sum, acc) => sum + (acc.availableBalance || 0), 0);

  // Find recurring deposits (use full 12 months for better pattern detection)
  const recurringDeposits = identifyRecurringDeposits(incomeTransactions);

  // Categorize expenses (3 months)
  const expensesByCategory = categorizeTransactions(expenseTransactions3Mo);

  // Map transaction to display format
  const mapToDisplay = (t: NormalizedTransaction): TransactionDisplay => ({
    date: t.date,
    amount: t.amount,
    name: t.name,
    category: t.category || 'Uncategorized',
    pending: t.pending,
    isIncome: t.isIncome,
    runningBalance: t.runningBalance,
  });

  return {
    summary: {
      totalIncome12Mo,
      totalIncome3Mo,
      estimatedMonthlyIncome,
      totalBalance,
      totalAvailable,
      accountCount: accounts.length,
      transactionCount: transactions.length,
      incomeTransactionCount: incomeTransactions.length,
    },
    accounts,
    income: {
      total12Mo: totalIncome12Mo,
      total3Mo: totalIncome3Mo,
      monthlyEstimate: estimatedMonthlyIncome,
      recurringDeposits,
      allDeposits: incomeTransactions3Mo.map((t) => ({
        date: t.date,
        amount: t.amount,
        name: t.name,
        category: t.category,
      })),
    },
    expenses: {
      total12Mo: totalExpenses12Mo,
      total3Mo: totalExpenses3Mo,
      byCategory: expensesByCategory,
    },
    // Return ALL transactions (12 months) sorted by date (newest first)
    transactions: [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(mapToDisplay),
    // Return 3-month transactions for display
    transactions3Mo: [...transactions3Mo]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(mapToDisplay),
    generatedAt: new Date().toISOString(),
  };
}

// ============ HELPER FUNCTIONS ============

/**
 * Identify recurring deposits (potential paychecks)
 */
function identifyRecurringDeposits(incomeTransactions: NormalizedTransaction[]): RecurringDeposit[] {
  // Group by approximate amount (within $50)
  const groups: Record<string, NormalizedTransaction[]> = {};

  incomeTransactions.forEach((t) => {
    // Round to nearest $50 for grouping similar amounts
    const key = Math.round(t.amount / 50) * 50;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  // Find groups with 2+ transactions (potentially recurring)
  const recurring = Object.entries(groups)
    .filter(([_, txns]) => txns.length >= 2)
    .map(([_, txns]) => {
      const avgAmount = txns.reduce((sum, t) => sum + t.amount, 0) / txns.length;
      
      return {
        approximateAmount: avgAmount,
        occurrences: txns.length,
        dates: txns.map((t) => t.date).sort(),
        likelySource: txns[0]?.name || 'Unknown',
      };
    })
    .sort((a, b) => b.approximateAmount - a.approximateAmount);

  return recurring;
}

/**
 * Categorize transactions by category
 */
function categorizeTransactions(transactions: NormalizedTransaction[]): CategoryTotal[] {
  const categories: Record<string, number> = {};

  transactions.forEach((t) => {
    const category = t.category || 'Other';
    categories[category] = (categories[category] || 0) + t.amount;
  });

  return Object.entries(categories)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => ({ category, amount }));
}

// ============ FORMATTING UTILITIES ============

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
