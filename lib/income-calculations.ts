/**
 * Income calculation utilities
 * These functions take raw financial data (Plaid or Teller) and compute useful metrics
 * Calculations are done at display time, not stored
 */

// ============ INCOME CLASSIFICATION PATTERNS ============

// Known payroll providers and indicators (high confidence income)
const PAYROLL_INDICATORS = [
  'payroll', 'salary', 'direct dep', 'dir dep', 'paycheck',
  'adp', 'gusto', 'paychex', 'workday', 'ceridian', 'paylocity',
  'paycor', 'bamboohr', 'namely', 'rippling', 'justworks',
  'quickbooks payroll', 'square payroll', 'intuit', 'wage',
  'employer', 'compensation', 'net pay', 'gross pay',
  'ach payment', 'ach credit', 'ach deposit', 'direct deposit'
];

// P2P services (typically NOT payroll income - lower confidence)
const P2P_SERVICES = [
  'venmo', 'zelle', 'cash app', 'cashapp', 'cash-app', 'paypal', 'apple cash',
  'google pay', 'gpay', 'square cash', 'popmoney', 'dwolla', 'wise', 'remitly',
  'western union', 'moneygram', 'worldremit'
];

// Transfer indicators (NOT income - should be excluded)
const TRANSFER_INDICATORS = [
  'transfer', 'xfer', 'from savings', 'from checking', 'to savings',
  'to checking', 'internal', 'between accounts', 'online transfer',
  'mobile transfer', 'wire transfer', 'savings', 'checking',
  '360 performance', '360 checking', '360 savings', 'money market',
  'brokerage', 'investment', 'ira', '401k', 'roth'
];

// Refund/return indicators (NOT regular income)
const REFUND_INDICATORS = [
  'refund', 'return', 'rebate', 'cashback', 'cash back', 'reversal',
  'credit adjustment', 'dispute credit', 'chargeback'
];

// Government benefits (legitimate income but different category)
const GOVERNMENT_INDICATORS = [
  'social security', 'ssi', 'ssdi', 'disability', 'unemployment',
  'irs', 'tax refund', 'stimulus', 'treasury', 'government'
];

export type IncomeType = 'payroll' | 'p2p' | 'transfer' | 'refund' | 'government' | 'other';
export type IncomeConfidence = 'high' | 'medium' | 'low';

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

/** Plaid personal_finance_category (PFC) – used for classification when available */
export interface PlaidPFC {
  primary: string;
  detailed: string;
  confidence_level?: string | null;
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
  /** Plaid only: PFC for classification. Omitted for Teller. */
  plaidCategory?: PlaidPFC | null;
  /** Set during classification (PFC-first for Plaid, name fallback for Teller). */
  incomeType?: IncomeType;
}

// ============ REPORT TYPES ============

export interface IncomeReport {
  summary: {
    totalIncome12Mo: number;
    totalIncome3Mo: number;
    estimatedMonthlyIncome: number;
    verifiedMonthlyIncome: number;  // Only high-confidence payroll income
    totalBalance: number;
    totalAvailable: number;
    accountCount: number;
    transactionCount: number;
    incomeTransactionCount: number;
    incomeConfidence: IncomeConfidence;
  };
  accounts: NormalizedAccount[];
  income: {
    total12Mo: number;
    total3Mo: number;
    monthlyEstimate: number;
    verified: {
      total3Mo: number;
      monthlyEstimate: number;
      sources: RecurringDeposit[];
    };
    other: {
      total3Mo: number;
      p2p: number;
      transfers: number;
      refunds: number;
    };
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
  incomeType: IncomeType;
  confidence: IncomeConfidence;
  /** Transaction ids in this recurring group (for recurring tab). Omitted in legacy/example data. */
  transactionIds?: string[];
}

export interface Deposit {
  date: string;
  amount: number;
  name: string;
  category: string | null;
  /** Classification (PFC or name-based). Used for "Recurring Income Patterns" filter. */
  incomeType?: IncomeType;
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
  incomeType?: IncomeType;
  /** True if this txn is part of a recurring INCOME deposit group (recurring tab). */
  isRecurringIncome?: boolean;
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
        // CRITICAL: Use description first - it contains the FULL transaction text
        // e.g., "Deposit from Great Lakes Prop PAYROLL" vs just "GREAT LAKES PROP"
        // The counterparty.name strips keywords like "PAYROLL", "DIRECT DEP", etc.
        // which breaks our income classification. DO NOT change this order!
        name: t.description || t.details?.counterparty?.name || 'Unknown',
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
    const pfc = t.personal_finance_category;
    const plaidCategory: PlaidPFC | undefined =
      pfc?.primary && pfc?.detailed
        ? { primary: pfc.primary, detailed: pfc.detailed, confidence_level: pfc.confidence_level ?? null }
        : undefined;

    return {
      id: t.transaction_id,
      accountId: t.account_id,
      amount: Math.abs(t.amount),
      date: t.date,
      name: t.original_description || t.name || t.merchant_name ||
            (t.counterparties?.length ? t.counterparties[0].name : null) || 'Unknown',
      category: t.category?.[0] || null,
      pending: t.pending || false,
      isIncome,
      runningBalance: null,
      plaidCategory: plaidCategory ?? null,
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

  // Classify: PFC-first for Plaid, name fallback for Teller / missing PFC
  const classifiedIncome12Mo = incomeTransactions.map(t => {
    const incomeType = classifyTransaction(t, provider);
    return { ...t, incomeType };
  });
  const classifiedIncome3Mo = incomeTransactions3Mo.map(t => {
    const incomeType = classifyTransaction(t, provider);
    return { ...t, incomeType };
  });

  const incomeTypeById = new Map<string, IncomeType>(
    classifiedIncome12Mo.map((t) => [t.id, t.incomeType!])
  );

  // Separate 3-month income by classification
  const payrollTransactions3Mo = classifiedIncome3Mo.filter(t => t.incomeType === 'payroll' || t.incomeType === 'government');
  const p2pTransactions3Mo = classifiedIncome3Mo.filter(t => t.incomeType === 'p2p');
  const transferTransactions3Mo = classifiedIncome3Mo.filter(t => t.incomeType === 'transfer');
  const refundTransactions3Mo = classifiedIncome3Mo.filter(t => t.incomeType === 'refund');

  // Separate 12-month payroll for recurring detection
  const payrollTransactions12Mo = classifiedIncome12Mo.filter(t => t.incomeType === 'payroll' || t.incomeType === 'government');

  // Calculate totals (12 months) - ALL deposits
  const totalIncome12Mo = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses12Mo = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Calculate totals (3 months) - ALL deposits
  const totalIncome3Mo = incomeTransactions3Mo.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses3Mo = expenseTransactions3Mo.reduce((sum, t) => sum + t.amount, 0);

  // Calculate verified income (payroll only - 3 months)
  const verifiedIncome3Mo = payrollTransactions3Mo.reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate other categories (3 months)
  const p2pIncome3Mo = p2pTransactions3Mo.reduce((sum, t) => sum + t.amount, 0);
  const transferIncome3Mo = transferTransactions3Mo.reduce((sum, t) => sum + t.amount, 0);
  const refundIncome3Mo = refundTransactions3Mo.reduce((sum, t) => sum + t.amount, 0);

  const recurringPayrollDeposits = identifyRecurringDeposits(payrollTransactions3Mo);
  const allRecurringDeposits = identifyRecurringDeposits(classifiedIncome3Mo);

  // Recurring tab = INCOME + recurring (payroll | government | other). Exclude transfer, refund, p2p.
  const recurringIncomeIds = new Set<string>();
  for (const d of allRecurringDeposits) {
    if (INCOME_TYPES_FOR_RECURRING.includes(d.incomeType)) {
      (d.transactionIds ?? []).forEach((id) => recurringIncomeIds.add(id));
    }
  }

  const verifiedSources = recurringPayrollDeposits.filter(d =>
    d.incomeType === 'payroll' || d.incomeType === 'government'
  );

  // Calculate verified monthly income directly from payroll transactions
  let verifiedMonthlyIncome: number;
  let incomeConfidence: IncomeConfidence;
  
  if (payrollTransactions3Mo.length > 0) {
    // A: We have identified payroll transactions - use actual sum
    verifiedMonthlyIncome = verifiedIncome3Mo / 3;
    incomeConfidence = verifiedSources.length > 0 ? 'high' : 'medium';
  } else if (allRecurringDeposits.length > 0) {
    // B: No payroll found, fall back to recurring deposits
    const nonTransferRecurring = allRecurringDeposits.filter(d => 
      d.incomeType !== 'transfer' && d.incomeType !== 'refund' && d.incomeType !== 'p2p'
    );
    verifiedMonthlyIncome = nonTransferRecurring.reduce((sum, s) => sum + s.approximateAmount * s.occurrences, 0) / 3;
    incomeConfidence = 'medium';
  } else {
    // No patterns found, use all deposits minus transfers/refunds (low confidence)
    const otherIncome = totalIncome3Mo - transferIncome3Mo - refundIncome3Mo;
    verifiedMonthlyIncome = otherIncome / 3;
    incomeConfidence = 'low';
  }

  // Estimate monthly income from 3-month data (all deposits)
  const estimatedMonthlyIncome = totalIncome3Mo / 3;

  // Account balances
  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
  const totalAvailable = accounts.reduce((sum, acc) => sum + (acc.availableBalance || 0), 0);

  // Categorize expenses (3 months)
  const expensesByCategory = categorizeTransactions(expenseTransactions3Mo);

  const mapToDisplay = (t: NormalizedTransaction): TransactionDisplay => ({
    date: t.date,
    amount: t.amount,
    name: t.name,
    category: t.category || 'Uncategorized',
    pending: t.pending,
    isIncome: t.isIncome,
    runningBalance: t.runningBalance,
    incomeType: incomeTypeById.get(t.id),
    isRecurringIncome: !!(t.isIncome && recurringIncomeIds.has(t.id)),
  });

  return {
    summary: {
      totalIncome12Mo,
      totalIncome3Mo,
      estimatedMonthlyIncome,
      verifiedMonthlyIncome,
      totalBalance,
      totalAvailable,
      accountCount: accounts.length,
      transactionCount: transactions.length,
      incomeTransactionCount: incomeTransactions.length,
      incomeConfidence,
    },
    accounts,
    income: {
      total12Mo: totalIncome12Mo,
      total3Mo: totalIncome3Mo,
      monthlyEstimate: estimatedMonthlyIncome,
      verified: {
        total3Mo: verifiedIncome3Mo,
        monthlyEstimate: verifiedMonthlyIncome,
        sources: verifiedSources,
      },
      other: {
        total3Mo: totalIncome3Mo - verifiedIncome3Mo - transferIncome3Mo - refundIncome3Mo,
        p2p: p2pIncome3Mo,
        transfers: transferIncome3Mo,
        refunds: refundIncome3Mo,
      },
      recurringDeposits: allRecurringDeposits,
      allDeposits: classifiedIncome3Mo.map((t) => ({
        date: t.date,
        amount: t.amount,
        name: t.name,
        category: t.category,
        incomeType: t.incomeType,
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
 * PFC primary/detailed → IncomeType. Use when personal_finance_category is present (Plaid).
 * Chart: INCOME+WAGES/PAYROLL→payroll, INCOME+ govt→government, INCOME+*→other, TRANSFER→transfer, etc.
 */
function classifyIncomeTypeFromPFC(pfc: PlaidPFC): IncomeType {
  const p = pfc.primary.toUpperCase();
  const d = (pfc.detailed || '').toUpperCase();

  if (p === 'TRANSFER') return 'transfer';
  if (p === 'REFUND' || d.includes('REFUND')) return 'refund';
  if (d === 'INCOME_WAGES' || d === 'INCOME_PAYROLL' || d === 'INCOME_RENTAL') return 'payroll';
  if (d.startsWith('INCOME_') && (d.includes('GOVERNMENT') || d.includes('BENEFIT') || d.includes('UNEMPLOYMENT') || d.includes('SOCIAL'))) return 'government';
  if (p === 'INCOME') return 'other'; // INCOME_DIVIDENDS, etc.

  return 'other';
}

/**
 * Classify an income transaction by type (name-based fallback for Teller or missing PFC).
 */
function classifyIncomeType(name: string): IncomeType {
  const lowerName = name.toLowerCase();
  if (TRANSFER_INDICATORS.some(ind => lowerName.includes(ind))) return 'transfer';
  if (REFUND_INDICATORS.some(ind => lowerName.includes(ind))) return 'refund';
  if (PAYROLL_INDICATORS.some(ind => lowerName.includes(ind))) return 'payroll';
  if (GOVERNMENT_INDICATORS.some(ind => lowerName.includes(ind))) return 'government';
  if (P2P_SERVICES.some(ind => lowerName.includes(ind))) return 'p2p';
  return 'other';
}

/**
 * Classify a normalized transaction: PFC-first for Plaid when available, else name-based.
 */
function classifyTransaction(t: NormalizedTransaction, provider: 'plaid' | 'teller'): IncomeType {
  if (provider === 'plaid' && t.plaidCategory?.primary) {
    return classifyIncomeTypeFromPFC(t.plaidCategory);
  }
  return classifyIncomeType(t.name);
}

/**
 * Determine confidence level based on income type and recurrence
 */
function determineConfidence(incomeType: IncomeType, occurrences: number, isRecurring: boolean): IncomeConfidence {
  // Payroll is high confidence
  if (incomeType === 'payroll') {
    return 'high';
  }
  
  // Government benefits are high confidence
  if (incomeType === 'government') {
    return 'high';
  }
  
  // Recurring non-P2P deposits are medium confidence
  if (isRecurring && incomeType !== 'p2p' && occurrences >= 3) {
    return 'medium';
  }
  
  // P2P and one-off deposits are low confidence
  return 'low';
}

const INCOME_TYPES_FOR_RECURRING: IncomeType[] = ['payroll', 'government', 'other'];

/**
 * Identify recurring deposits. Uses pre-attached incomeType.
 * Recurring tab = INCOME + recurring (payroll | government | other).
 */
function identifyRecurringDeposits(incomeTransactions: NormalizedTransaction[]): RecurringDeposit[] {
  const groups: Record<string, NormalizedTransaction[]> = {};

  incomeTransactions.forEach((t) => {
    const amountKey = Math.round(t.amount / 50) * 50;
    const nameKey = t.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
    const key = `${nameKey}-${amountKey}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  const recurring = Object.entries(groups)
    .filter(([_, txns]) => txns.length >= 2)
    .map(([_, txns]) => {
      const avgAmount = txns.reduce((sum, t) => sum + t.amount, 0) / txns.length;
      const sourceName = txns[0]?.name || 'Unknown';
      const incomeType = txns[0]?.incomeType ?? classifyIncomeType(sourceName);
      const confidence = determineConfidence(incomeType, txns.length, true);
      const transactionIds = txns.map((t) => t.id);
      return {
        approximateAmount: avgAmount,
        occurrences: txns.length,
        dates: txns.map((t) => t.date).sort(),
        likelySource: sourceName,
        incomeType,
        confidence,
        transactionIds,
      };
    })
    .sort((a, b) => {
      const confOrder = { high: 0, medium: 1, low: 2 };
      if (confOrder[a.confidence] !== confOrder[b.confidence]) {
        return confOrder[a.confidence] - confOrder[b.confidence];
      }
      return b.approximateAmount - a.approximateAmount;
    });

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
