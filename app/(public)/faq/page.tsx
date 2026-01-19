'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface FAQ {
  q: string;
  a: string | React.ReactNode;
}

interface Category {
  category: string;
  questions: FAQ[];
}

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const faqs: Category[] = [
    {
      category: "Getting Started",
      questions: [
        {
          q: "What is IncomeChecker.com?",
          a: "IncomeChecker.com is a secure platform that allows organizations to verify income by connecting directly to bank accounts. We provide detailed income reports based on real bank transaction data, making the verification process faster and more reliable than traditional methods like pay stubs or employer calls."
        },
        {
          q: "How does the verification process work?",
          a: "The process is simple: (1) Create a verification request through your dashboard, (2) Share the verification link with the individual being verified, (3) They securely connect their bank account via Teller, (4) We analyze their transaction history to calculate income, and (5) You receive a comprehensive income report. The entire process typically takes just a few minutes."
        },
        {
          q: "Is my bank supported?",
          a: (
            <>
              We support connections to over 7,000 U.S. banks and credit unions. You can view our complete list of supported banks on our{' '}
              <Link href="/banks" className="text-emerald-600 hover:text-emerald-700 underline">
                Supported Banks page
              </Link>
              . If your bank isn't listed, contact us and we can help you connect.
            </>
          )
        }
      ]
    },
    {
      category: "Security & Privacy",
      questions: [
        {
          q: "Is my bank account information secure?",
          a: "Yes, security is our top priority. We use bank-level encryption (AES-256 at rest, TLS 1.3 in transit) and work with Teller, a secure financial data provider. Your bank login credentials are never stored, and bank connections are immediately disconnected after data retrieval. All access tokens are deleted after use."
        },
        {
          q: "What data do you collect?",
          a: "We only collect the minimum data necessary for income verification. This includes transaction history, account balances, and account type information. We never store full account numbers (only last 4 digits), bank login credentials, or access tokens. All data collection requires explicit consent from the individual being verified."
        },
        {
          q: "Who can see my financial information?",
          a: "Only the requesting party who created the verification request can view your income report. We never share your financial data with third parties, and you can revoke access at any time through your bank account settings."
        },
        {
          q: "Can I delete my data?",
          a: (
            <>
              Yes. Individuals can request data deletion through their verification link, and requesters can delete verification requests from their dashboard. We comply with GDPR and CCPA requirements for data deletion. Visit our{' '}
              <Link href="/security" className="text-emerald-600 hover:text-emerald-700 underline">
                Security page
              </Link>
              {' '}for more information on data deletion procedures.
            </>
          )
        }
      ]
    },
    {
      category: "For Requesters",
      questions: [
        {
          q: "What information is included in the income report?",
          a: "Our income reports include: monthly income estimates calculated from deposits, recurring payroll deposit patterns, deposit sources and transaction descriptions, current bank balances, transaction history (up to 12 months depending on your plan), account types, and transaction categorization. Reports also include illustrative monthly capacity calculations for 3x and 10x requirements."
        },
        {
          q: "How accurate are the income calculations?",
          a: "Our income calculations are based on actual bank transaction data. We use sophisticated pattern detection to identify payroll deposits and distinguish them from other types of income (P2P transfers, refunds, etc.). The system provides confidence scores to help you understand the reliability of income estimates. However, final decisions remain your responsibility."
        },
        {
          q: "Can I send verification requests to multiple individuals?",
          a: "Yes. You can create unlimited verification requests on all paid plans. Each request generates a unique, secure link that you can share via email or any other method. Starter plans include 10 verifications per month, and Pro plans include 50 verifications per month. Additional verifications beyond your plan limit are $14.95 each."
        },
        {
          q: "How long do verification reports stay available?",
          a: "Verification reports are stored for 1 year on paid plans. You can access them anytime from your dashboard during this period. After 1 year, reports are automatically deleted for data privacy compliance."
        }
      ]
    },
    {
      category: "For Applicants ",
      questions: [
        {
          q: "Do I need to create an account?",
          a: "No, you don't need to create an account. You can complete the verification process using just the unique link provided by the requesting party. The entire process works without requiring you to sign up for our service."
        },
        {
          q: "What if I don't want to share my bank account?",
          a: "Bank account connection is voluntary. However, without bank data, we cannot generate an income verification report. If you prefer not to connect your account, you may need to provide alternative documentation to the requesting party, such as pay stubs or tax returns."
        },
        {
          q: "How long does the verification take?",
          a: "The verification process typically takes 2-5 minutes. This includes connecting your bank account, selecting which accounts to share, and waiting for the data analysis to complete. You'll receive confirmation once the report is ready."
        },
        {
          q: "Can I revoke access after verification?",
          a: "Yes, bank connections are automatically disconnected immediately after data retrieval. If you want to ensure access is revoked, you can also do so directly through your bank account settings. We don't maintain ongoing access to your accounts."
        },
        {
          q: "Will this affect my credit score?",
          a: "No. Income verification does not involve any credit checks or impact your credit score. We only access transaction history and balance information, which does not affect your credit rating."
        }
      ]
    },
    {
      category: "Pricing & Plans",
      questions: [
        {
          q: "How much does IncomeChecker.com cost?",
          a: (
            <>
              We offer flexible pricing options: Pay-as-you-go at $14.99 per verification, Starter plan at $59/month (includes 10 verifications), and Pro plan at $129/month (includes 50 verifications). Overage pricing applies after included verifications. See our{' '}
              <Link href="/pricing" className="text-emerald-600 hover:text-emerald-700 underline">
                Pricing page
              </Link>
              {' '}for full details.
            </>
          )
        },
        {
          q: "What payment methods do you accept?",
          a: "We accept all major credit cards and process payments securely through Stripe. Plans are billed monthly, and one-time payments are charged immediately upon verification completion."
        },
        {
          q: "Can I cancel my subscription anytime?",
          a: (
            <>
              Yes, you can cancel your subscription at any time from your{' '}
              <Link href="/settings" className="text-emerald-600 hover:text-emerald-700 underline">
                Settings page
              </Link>
              . You'll continue to have access to your plan benefits until the end of your current billing period. No cancellation fees apply.
            </>
          )
        },
        {
          q: "Do you offer refunds?",
          a: "We offer refunds for unused verifications within 30 days of purchase. If you're not satisfied with the service, please contact our support team to discuss refund options."
        }
      ]
    },
    {
      category: "Technical Support",
      questions: [
        {
          q: "What should I do if my bank connection fails?",
          a: (
            <>
              If you experience connection issues, try the following: (1) Ensure your bank is supported (check our{' '}
              <Link href="/banks" className="text-emerald-600 hover:text-emerald-700 underline">
                Supported Banks page
              </Link>
              ), (2) Clear your browser cache and cookies, (3) Try using a different browser or device, (4) Contact your bank to ensure there are no restrictions on third-party access. If problems persist, contact our support team.
            </>
          )
        },
        {
          q: "The verification link expired. What do I do?",
          a: "Verification links expire after a set period for security reasons. Contact the requesting party to request a new verification link. They can easily generate a new one from their dashboard."
        },
        {
          q: "Can I use IncomeChecker.com on mobile devices?",
          a: "Yes, IncomeChecker.com works on all modern mobile devices. The bank connection process and dashboard are fully responsive and optimized for mobile browsers."
        },
        {
          q: "Who can I contact for help?",
          a: "You can reach our support team via email at info@incomechecker.com. We typically respond within 24 hours during business days. For urgent matters, paid plan subscribers receive priority support."
        }
      ]
    }
  ];

  // Filter FAQs based on selected category and search term
  const filteredFAQs = useMemo(() => {
    let filtered = faqs;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(cat => cat.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.map(cat => ({
        ...cat,
        questions: cat.questions.filter(faq => {
          const questionMatch = faq.q.toLowerCase().includes(term);
          const answerMatch = typeof faq.a === 'string' ? faq.a.toLowerCase().includes(term) : false;
          return questionMatch || answerMatch;
        })
      })).filter(cat => cat.questions.length > 0);
    }

    return filtered;
  }, [selectedCategory, searchTerm, faqs]);

  const toggleQuestion = (category: string, index: number) => {
    const key = `${category}-${index}`;
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const allCategories = faqs.map(cat => cat.category);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">QUICK ANSWERS</p>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">IncomeChecker.com FAQs</h1>
          <p className="text-lg text-gray-600">Your questions answered</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <input
              type="text"
              placeholder="Search verifications, bank connections, pricing..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-10 pr-4 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Filter by Topic */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">FILTER BY TOPIC</p>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedCategory === null
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  All Topics
                </button>
                {allCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {filteredFAQs.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <p className="text-gray-500">No questions found matching your search.</p>
              </div>
            ) : (
              filteredFAQs.map((category) => (
                <div key={category.category} className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">{category.category}</h2>
                  <div className="space-y-4">
                    {category.questions.map((faq, index) => {
                      const questionKey = `${category.category}-${index}`;
                      const isExpanded = expandedQuestions.has(questionKey);

                      return (
                        <div
                          key={index}
                          className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() => toggleQuestion(category.category, index)}
                            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                          >
                            <span className="font-semibold text-base text-gray-900 pr-4">{faq.q}</span>
                            <div className="flex-shrink-0">
                              {isExpanded ? (
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              ) : (
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              )}
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="px-6 py-5 border-t border-gray-100 bg-gray-50">
                              <div className="text-base text-gray-800 leading-7 max-w-none">
                                {typeof faq.a === 'string' ? <p className="mb-0">{faq.a}</p> : faq.a}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
