'use client';

import { useEffect } from 'react';
import ReportContent from '../[token]/ReportContent';
import { IncomeReport, type IncomeType } from '@/lib/income-calculations';
import { analytics } from '@/utils/analytics';

// Metadata needs to be handled differently for client components
// We'll set it via useEffect or in a separate layout

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
  
  // Generate payroll deposits for 12 complete months
  // Start from 12 months ago (but use the first of that month to ensure complete months)
  const startDate = new Date(now);
  startDate.setMonth(startDate.getMonth() - 12);
  startDate.setDate(1); // Start of month
  startDate.setHours(0, 0, 0, 0); // Start of day
  
  let currentDate = new Date(startDate);
  let depositCount = 0;
  
  while (currentDate <= now) {
    const isNewJob = currentDate >= jobChangeDate;
    const amount = isNewJob ? newJobAmount : oldJobAmount;
    const employerName = isNewJob ? 'TechCorp Solutions' : 'ACME Corporation';
    const payFrequency = isNewJob ? 7 : 14; // Weekly for new job, bi-weekly for old job
    
    transactions.push({
      date: currentDate.toISOString(),
      amount: amount,
      name: employerName,
      category: 'Transfer',
      pending: false,
      isIncome: true,
      runningBalance: null,
      incomeType: 'payroll' as const,
      plaidCategory: { primary: 'INCOME', detailed: 'INCOME_SALARY' },
    });
    
    depositCount++;
    // Move forward by pay frequency (weekly for new job, bi-weekly for old job)
    currentDate.setDate(currentDate.getDate() + payFrequency);
  }
  
  // Create a pool of 100 random debit transactions
  const debitTransactionPool = [
    { name: 'WALMART', amount: 85, category: 'Shops' },
    { name: 'TARGET', amount: 120, category: 'Shops' },
    { name: 'KROGER', amount: 145, category: 'Food and Drink' },
    { name: 'SAFEWAY', amount: 95, category: 'Food and Drink' },
    { name: 'WHOLE FOODS', amount: 175, category: 'Food and Drink' },
    { name: 'TRADER JOES', amount: 85, category: 'Food and Drink' },
    { name: 'CHEVRON', amount: 65, category: 'Transportation' },
    { name: 'SHELL', amount: 70, category: 'Transportation' },
    { name: 'EXXON', amount: 68, category: 'Transportation' },
    { name: 'BP', amount: 72, category: 'Transportation' },
    { name: 'UBER', amount: 28, category: 'Transportation' },
    { name: 'LYFT', amount: 32, category: 'Transportation' },
    { name: 'AMAZON', amount: 45, category: 'Shops' },
    { name: 'AMAZON.COM', amount: 89, category: 'Shops' },
    { name: 'APPLE.COM', amount: 15, category: 'Shops' },
    { name: 'NETFLIX', amount: 16, category: 'Recreation' },
    { name: 'SPOTIFY', amount: 11, category: 'Recreation' },
    { name: 'DISNEY+', amount: 14, category: 'Recreation' },
    { name: 'HULU', amount: 13, category: 'Recreation' },
    { name: 'STARBUCKS', amount: 8, category: 'Food and Drink' },
    { name: 'DUNKIN', amount: 6, category: 'Food and Drink' },
    { name: 'CHIPOTLE', amount: 12, category: 'Food and Drink' },
    { name: 'MCDONALDS', amount: 9, category: 'Food and Drink' },
    { name: 'SUBWAY', amount: 11, category: 'Food and Drink' },
    { name: 'PANERA BREAD', amount: 14, category: 'Food and Drink' },
    { name: 'OLIVE GARDEN', amount: 48, category: 'Food and Drink' },
    { name: 'APPLEBEES', amount: 42, category: 'Food and Drink' },
    { name: 'OUTBACK STEAKHOUSE', amount: 68, category: 'Food and Drink' },
    { name: 'HOME DEPOT', amount: 125, category: 'Shops' },
    { name: 'LOWES', amount: 135, category: 'Shops' },
    { name: 'ACE HARDWARE', amount: 45, category: 'Shops' },
    { name: 'CVS PHARMACY', amount: 32, category: 'Shops' },
    { name: 'WALGREENS', amount: 28, category: 'Shops' },
    { name: 'RIte Aid', amount: 25, category: 'Shops' },
    { name: 'PETCO', amount: 65, category: 'Shops' },
    { name: 'PETSMART', amount: 58, category: 'Shops' },
    { name: 'BEST BUY', amount: 299, category: 'Shops' },
    { name: 'COSTCO', amount: 185, category: 'Shops' },
    { name: 'SAMS CLUB', amount: 165, category: 'Shops' },
    { name: 'DOLLAR TREE', amount: 12, category: 'Shops' },
    { name: 'DOLLAR GENERAL', amount: 18, category: 'Shops' },
    { name: 'FIVE BELOW', amount: 22, category: 'Shops' },
    { name: 'MADEWELL', amount: 89, category: 'Shops' },
    { name: 'OLD NAVY', amount: 45, category: 'Shops' },
    { name: 'GAP', amount: 68, category: 'Shops' },
    { name: 'NIKE', amount: 125, category: 'Shops' },
    { name: 'ADIDAS', amount: 98, category: 'Shops' },
    { name: 'BARNES & NOBLE', amount: 32, category: 'Shops' },
    { name: 'BOOKS-A-MILLION', amount: 28, category: 'Shops' },
    { name: 'MARSHALLS', amount: 55, category: 'Shops' },
    { name: 'TJ MAXX', amount: 62, category: 'Shops' },
    { name: 'ROSS', amount: 42, category: 'Shops' },
    { name: 'BURLINGTON', amount: 48, category: 'Shops' },
    { name: 'DSW', amount: 85, category: 'Shops' },
    { name: 'FOOT LOCKER', amount: 125, category: 'Shops' },
    { name: 'H&M', amount: 35, category: 'Shops' },
    { name: 'FOREVER 21', amount: 28, category: 'Shops' },
    { name: 'ZARA', amount: 68, category: 'Shops' },
    { name: 'UTILITY BILL', amount: 145, category: 'Bills and Utilities' },
    { name: 'ELECTRIC COMPANY', amount: 125, category: 'Bills and Utilities' },
    { name: 'GAS COMPANY', amount: 85, category: 'Bills and Utilities' },
    { name: 'WATER DEPARTMENT', amount: 65, category: 'Bills and Utilities' },
    { name: 'AT&T', amount: 95, category: 'Bills and Utilities' },
    { name: 'VERIZON', amount: 88, category: 'Bills and Utilities' },
    { name: 'T-MOBILE', amount: 82, category: 'Bills and Utilities' },
    { name: 'SPRINT', amount: 85, category: 'Bills and Utilities' },
    { name: 'COMCAST', amount: 89, category: 'Bills and Utilities' },
    { name: 'XFINITY', amount: 92, category: 'Bills and Utilities' },
    { name: 'SPECTRUM', amount: 79, category: 'Bills and Utilities' },
    { name: 'DIRECTV', amount: 115, category: 'Bills and Utilities' },
    { name: 'DISH NETWORK', amount: 108, category: 'Bills and Utilities' },
    { name: 'GYM MEMBERSHIP', amount: 45, category: 'Recreation' },
    { name: 'PLANET FITNESS', amount: 22, category: 'Recreation' },
    { name: '24 HOUR FITNESS', amount: 35, category: 'Recreation' },
    { name: 'GOLDS GYM', amount: 42, category: 'Recreation' },
    { name: 'CINEMA', amount: 28, category: 'Recreation' },
    { name: 'AMC THEATERS', amount: 32, category: 'Recreation' },
    { name: 'REGAL CINEMAS', amount: 29, category: 'Recreation' },
    { name: 'BOWLING ALLEY', amount: 48, category: 'Recreation' },
    { name: 'MINI GOLF', amount: 35, category: 'Recreation' },
    { name: 'DENTIST', amount: 185, category: 'Medical' },
    { name: 'DOCTOR', amount: 125, category: 'Medical' },
    { name: 'PHARMACY', amount: 42, category: 'Medical' },
    { name: 'HOSPITAL', amount: 450, category: 'Medical' },
    { name: 'URGENT CARE', amount: 165, category: 'Medical' },
    { name: 'EYE DOCTOR', amount: 95, category: 'Medical' },
    { name: 'VET CLINIC', amount: 125, category: 'Medical' },
    { name: 'POST OFFICE', amount: 12, category: 'Service' },
    { name: 'UPS STORE', amount: 18, category: 'Service' },
    { name: 'FEDEX', amount: 22, category: 'Service' },
    { name: 'DRY CLEANERS', amount: 28, category: 'Service' },
    { name: 'LAUNDROMAT', amount: 15, category: 'Service' },
    { name: 'HAIR SALON', amount: 65, category: 'Service' },
    { name: 'BARBERSHOP', amount: 25, category: 'Service' },
    { name: 'NAIL SALON', amount: 45, category: 'Service' },
    { name: 'CAR WASH', amount: 18, category: 'Service' },
    { name: 'AUTO REPAIR', amount: 285, category: 'Service' },
    { name: 'OIL CHANGE', amount: 48, category: 'Service' },
    { name: 'TIRE SHOP', amount: 425, category: 'Service' },
    { name: 'HOTEL', amount: 145, category: 'Travel' },
    { name: 'AIRLINE', amount: 385, category: 'Travel' },
    { name: 'RENTAL CAR', amount: 125, category: 'Travel' },
    { name: 'AIRBNB', amount: 185, category: 'Travel' },
  ];
  
  // Calculate the first day of the month 12 months ago
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);
  
  // Randomly distribute 70 debit transactions per month across 12 complete months + current month
  for (let monthOffset = 0; monthOffset <= 12; monthOffset++) {
    // Create a copy of the pool and shuffle it
    const shuffled = [...debitTransactionPool].sort(() => Math.random() - 0.5);
    
    // Take 70 random transactions for this month
    const selectedDebits = shuffled.slice(0, 70);
    
    // Calculate the target month (12 months ago + monthOffset)
    const targetMonth = new Date(twelveMonthsAgo);
    targetMonth.setMonth(targetMonth.getMonth() + monthOffset);
    
    const isCurrentMonth = targetMonth.getMonth() === now.getMonth() && targetMonth.getFullYear() === now.getFullYear();
    const maxDay = isCurrentMonth ? Math.min(28, now.getDate()) : 28;

    selectedDebits.forEach((debit) => {
      const date = new Date(targetMonth);
      const randomDay = Math.floor(Math.random() * maxDay) + 1;
      date.setDate(randomDay);
      
      if (date > now) return;
      
      // Add some random variation to the amount (±20%)
      const variation = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
      const amount = Math.round(debit.amount * variation);
      
      transactions.push({
        date: date.toISOString(),
        amount: amount,
        name: debit.name,
        category: debit.category,
        pending: false,
        isIncome: false,
        runningBalance: null,
      });
    });
  }
  
  // Add P2P (peer-to-peer) transactions - both incoming and outgoing
  // These should be filtered out by the system to show users we exclude P2P
  const p2pServices = [
    { name: 'VENMO', category: 'P2P' },
    { name: 'ZELLE', category: 'P2P' },
    { name: 'CASH APP', category: 'P2P' },
    { name: 'CASHAPP', category: 'P2P' },
    { name: 'PAYPAL', category: 'P2P' },
    { name: 'APPLE CASH', category: 'P2P' },
    { name: 'GOOGLE PAY', category: 'P2P' },
    { name: 'GPAY', category: 'P2P' },
    { name: 'SQUARE CASH', category: 'P2P' },
    { name: 'WISE', category: 'P2P' },
  ];
  
  // Add P2P transactions throughout the 12 months + current month
  for (let monthOffset = 0; monthOffset <= 12; monthOffset++) {
    // Add 3-8 P2P transactions per month
    const p2pCount = 3 + Math.floor(Math.random() * 6); // 3-8 transactions
    
    for (let i = 0; i < p2pCount; i++) {
      const targetMonth = new Date(twelveMonthsAgo);
      targetMonth.setMonth(targetMonth.getMonth() + monthOffset);
      
      const isCurrentMonth = targetMonth.getMonth() === now.getMonth() && targetMonth.getFullYear() === now.getFullYear();
      const maxDay = isCurrentMonth ? Math.min(28, now.getDate()) : 28;
      const randomDay = Math.floor(Math.random() * maxDay) + 1;
      const date = new Date(targetMonth);
      date.setDate(randomDay);
      
      if (date > now) continue;
      
      // Random P2P service
      const p2pService = p2pServices[Math.floor(Math.random() * p2pServices.length)];
      
      // Mix of incoming (40%) and outgoing (60%)
      const isIncome = Math.random() < 0.4;
      
      // P2P amounts are typically smaller: $5-$200 for outgoing, $10-$300 for incoming
      const amount = isIncome 
        ? Math.floor(Math.random() * 290) + 10  // $10-$300
        : Math.floor(Math.random() * 195) + 5;  // $5-$200
      
      // Add person names for P2P transactions
      const personNames = [
        'Sarah M', 'Mike Johnson', 'Jennifer L', 'David Smith', 'Emma Wilson',
        'Chris Brown', 'Alex Taylor', 'Jordan Lee', 'Sam Davis', 'Taylor Kim',
        'Ryan Chen', 'Maya Patel', 'Lucas Garcia', 'Sophia Martinez', 'Noah Anderson'
      ];
      const personName = personNames[Math.floor(Math.random() * personNames.length)];
      
      transactions.push({
        date: date.toISOString(),
        amount: amount,
        name: `${p2pService.name} ${isIncome ? 'FROM' : 'TO'} ${personName}`,
        category: p2pService.category,
        pending: false,
        isIncome: isIncome,
        runningBalance: null,
        ...(isIncome && { incomeType: 'p2p' as const }),
      });
    }
  }
  
  // Sort by date (oldest first for balance calculation)
  const sorted = transactions.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Calculate running balances (from oldest to newest)
  // Start with a realistic balance for someone making ~$65k/year
  // Typical checking account might have $2,000-$3,000 as a starting point
  let runningBalance = 2500; // Starting balance 12 months ago
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
    
    // Get all income deposits (payroll have incomeType from generateSampleTransactions)
    const allIncomeDeposits = sampleTransactions
      .filter(t => t.isIncome)
      .map(t => ({
        date: t.date,
        amount: t.amount,
        name: t.name,
        category: t.category || 'Transfer',
        incomeType: (t as { incomeType?: IncomeType }).incomeType,
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
      transactionIds: deps.map((_, i) => `example-${name}-${i}`),
    }));
    
    // Current employer (most recent)
    const currentEmployer = deposits3Mo[0]?.name || 'TechCorp Solutions';
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
  useEffect(() => {
    analytics.sampleReportViewed();
  }, []);

  return (
    <ReportContent
      verification={sampleVerification}
      reportData={sampleReportData}
      isCalculated={true}
    />
  );
}
