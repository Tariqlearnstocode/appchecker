import ReportContent from '../[token]/ReportContent';
import { IncomeReport } from '@/lib/income-calculations';

// Sample verification data
const sampleVerification = {
  individual_name: 'John Doe',
  individual_email: 'john.doe@example.com',
  requested_by_name: 'LLM Income Group',
  purpose: 'Application #1234567890)',
  monthly_rent: null,
  created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
  completed_at: new Date().toISOString(),
};

// Generate sample transactions first
const generateSampleTransactions = () => {
  const transactions = [];
  const now = new Date();
  
  // Job change: 6 months ago (switch from old job to new job)
  const jobChangeDate = new Date(now);
  jobChangeDate.setMonth(jobChangeDate.getMonth() - 6);
  
  // Old job: $2,200 bi-weekly (every 14 days) = ~$57,200/year
  // New job: $1,300 weekly (every 7 days) = ~$67,600/year
  const oldJobAmount = 2200;
  const newJobAmount = 1300;
  
  // Generate payroll deposits for 12 months
  // Start from 12 months ago
  const startDate = new Date(now);
  startDate.setMonth(startDate.getMonth() - 12);
  startDate.setDate(1); // Start of month
  
  let currentDate = new Date(startDate);
  let depositCount = 0;
  
  while (currentDate <= now) {
    const isNewJob = currentDate >= jobChangeDate;
    const amount = isNewJob ? newJobAmount : oldJobAmount;
    const employerName = isNewJob ? 'TechCorp Solutions Payroll' : 'ACME Corporation Payroll';
    const payFrequency = isNewJob ? 7 : 14; // Weekly for new job, bi-weekly for old job
    
    transactions.push({
      date: currentDate.toISOString(),
      amount: amount,
      name: employerName,
      category: 'Transfer',
      pending: false,
      isIncome: true,
      runningBalance: null,
    });
    
    depositCount++;
    // Move forward by pay frequency (weekly for new job, bi-weekly for old job)
    currentDate.setDate(currentDate.getDate() + payFrequency);
  }
  
  // Add some expenses
  const expenseCategories = [
    { name: 'Grocery Store', amount: -150, category: 'Food and Drink' },
    { name: 'Gas Station', amount: -80, category: 'Transportation' },
    { name: 'Electric Bill', amount: -120, category: 'Bills and Utilities' },
    { name: 'Coffee Shop', amount: -25, category: 'Food and Drink' },
    { name: 'Restaurant', amount: -75, category: 'Food and Drink' },
    { name: 'Online Purchase', amount: -200, category: 'Shops' },
    { name: 'Phone Bill', amount: -90, category: 'Bills and Utilities' },
    { name: 'Gym Membership', amount: -50, category: 'Recreation' },
  ];
  
  // Add expenses for each month (12 months)
  for (let month = 0; month < 12; month++) {
    expenseCategories.forEach((expense, idx) => {
      const date = new Date(now);
      date.setMonth(date.getMonth() - month);
      date.setDate(5 + (idx % 28)); // Spread throughout the month
      
      // Skip if date is in the future
      if (date > now) return;
      
      transactions.push({
        date: date.toISOString(),
        amount: Math.abs(expense.amount),
        name: expense.name,
        category: expense.category,
        pending: false,
        isIncome: false,
        runningBalance: null,
      });
    });
  }
  
  // Sort by date (oldest first for balance calculation)
  const sorted = transactions.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Calculate running balances (from oldest to newest)
  let runningBalance = 5000; // Starting balance 12 months ago
  const transactionsWithBalance = sorted.map(txn => {
    if (txn.isIncome) {
      runningBalance += txn.amount;
    } else {
      runningBalance -= txn.amount;
    }
    return {
      ...txn,
      runningBalance,
    };
  });
  
  // Sort by date (newest first) for display
  return transactionsWithBalance.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

const sampleTransactions = generateSampleTransactions();

// Calculate totals from transactions
const calculateTotals = () => {
  const allTransactions = sampleTransactions;
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  // 12 months of income
  const income12Mo = allTransactions
    .filter(t => t.isIncome)
    .reduce((sum, t) => sum + t.amount, 0);
  
  // 3 months of income
  const income3Mo = allTransactions
    .filter(t => t.isIncome && new Date(t.date) >= threeMonthsAgo)
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Monthly estimates
  const monthlyEstimate = income3Mo / 3;
  const monthlyEstimate12Mo = income12Mo / 12;
  
  // Income transaction counts
  const incomeTransactions = allTransactions.filter(t => t.isIncome);
  const incomeTransactions3Mo = allTransactions.filter(t => 
    t.isIncome && new Date(t.date) >= threeMonthsAgo
  );
  
  return {
    totalIncome12Mo: income12Mo,
    totalIncome3Mo: income3Mo,
    estimatedMonthlyIncome: monthlyEstimate,
    verifiedMonthlyIncome: monthlyEstimate,
    incomeTransactionCount: incomeTransactions.length,
    incomeTransactionCount3Mo: incomeTransactions3Mo.length,
  };
};

const totals = calculateTotals();

// Sample report data
const sampleReportData: IncomeReport = {
  summary: {
    totalIncome12Mo: totals.totalIncome12Mo,
    totalIncome3Mo: totals.totalIncome3Mo,
    estimatedMonthlyIncome: totals.estimatedMonthlyIncome,
    verifiedMonthlyIncome: totals.verifiedMonthlyIncome,
    incomeConfidence: 'high' as const,
    totalBalance: 12500,
    totalAvailable: 12000,
    accountCount: 2,
    transactionCount: sampleTransactions.length,
    incomeTransactionCount: totals.incomeTransactionCount,
  },
  accounts: [
    {
      id: 'acc_1',
      name: 'Chase Total Checking',
      officialName: 'Chase Total Checking',
      type: 'depository',
      subtype: 'checking',
      mask: '1234',
      currentBalance: 8500,
      availableBalance: 8500,
      institution: 'Chase',
    },
    {
      id: 'acc_2',
      name: 'Chase Savings',
      officialName: 'Chase Savings',
      type: 'depository',
      subtype: 'savings',
      mask: '5678',
      currentBalance: 4000,
      availableBalance: 3500,
      institution: 'Chase',
    },
  ],
  income: (() => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    // Get all income deposits (ensure they're marked as payroll for the report)
    const allIncomeDeposits = sampleTransactions
      .filter(t => t.isIncome)
      .map(t => ({
        date: t.date,
        amount: t.amount,
        name: t.name, // Names already contain "Payroll" so isPayroll() will match
        category: t.category || 'Transfer',
      }));
    
    // Get 3-month deposits
    const deposits3Mo = allIncomeDeposits.filter(d => 
      new Date(d.date) >= threeMonthsAgo
    );
    
    // Group by employer for recurring deposits
    const employerGroups: Record<string, typeof deposits3Mo> = {};
    deposits3Mo.forEach(dep => {
      const key = dep.name;
      if (!employerGroups[key]) employerGroups[key] = [];
      employerGroups[key].push(dep);
    });
    
    // Create recurring deposit sources
    const recurringDeposits = Object.entries(employerGroups).map(([name, deps]) => ({
      approximateAmount: deps[0].amount,
      occurrences: deps.length,
      dates: deps.map(d => d.date),
      likelySource: name,
      incomeType: 'payroll' as const,
      confidence: 'high' as const,
    }));
    
    // Current employer (most recent)
    const currentEmployer = deposits3Mo[0]?.name || 'TechCorp Solutions Payroll';
    const currentAmount = deposits3Mo[0]?.amount || 6500;
    
    return {
      total12Mo: totals.totalIncome12Mo,
      total3Mo: totals.totalIncome3Mo,
      monthlyEstimate: totals.estimatedMonthlyIncome,
      verified: {
        total3Mo: totals.totalIncome3Mo,
        monthlyEstimate: totals.estimatedMonthlyIncome,
        sources: recurringDeposits,
      },
      other: {
        total3Mo: 0,
        p2p: 0,
        transfers: 0,
        refunds: 0,
      },
      recurringDeposits,
      allDeposits: allIncomeDeposits,
    };
  })(),
  expenses: (() => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const allExpenses = sampleTransactions.filter(t => !t.isIncome);
    const expenses3Mo = allExpenses.filter(t => new Date(t.date) >= threeMonthsAgo);
    
    // Calculate by category
    const categoryTotals: Record<string, number> = {};
    expenses3Mo.forEach(exp => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });
    
    return {
      total12Mo: allExpenses.reduce((sum, e) => sum + e.amount, 0),
      total3Mo: expenses3Mo.reduce((sum, e) => sum + e.amount, 0),
      byCategory: Object.entries(categoryTotals).map(([category, amount]) => ({
        category,
        amount,
      })),
    };
  })(),
  transactions: sampleTransactions,
  transactions3Mo: sampleTransactions, // For example, show all transactions
  generatedAt: new Date().toISOString(),
};

export default function ExampleReportPage() {
  return (
    <ReportContent
      verification={sampleVerification}
      reportData={sampleReportData}
      isCalculated={true}
    />
  );
}
