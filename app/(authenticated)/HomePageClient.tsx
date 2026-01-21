'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toasts/use-toast';
import Link from 'next/link';
import { Plus, Check, ShieldCheck, FileCheck, X } from 'lucide-react';
import { Verification } from '@/components/VerificationsTable';
import { NewVerificationTab } from '@/components/NewVerificationTab';
import { VerificationsListTab } from '@/components/VerificationsListTab';
import { ActionsSidebar } from '@/components/ActionsSidebar';
import { PricingModal } from '@/components/ui/Pricing';
import { AuthModal } from '@/components/AuthModal';
import { LimitReachedModal } from '@/components/LimitReachedModal';
import { useAuth } from '@/contexts/AuthContext';
import { analytics } from '@/utils/analytics';

type ActiveTab = 'new' | 'all' | 'pending' | 'completed' | 'canceled';

interface HomePageClientProps {
  initialVerifications: Verification[];
  initialLandlordInfo: { name: string; email: string };
}

// Plan & Usage component for mobile (rendered separately after main content)
function PlanAndUsageMobile({ 
  user, 
  verifications, 
  selectedVerification, 
  onUpgradeClick 
}: { 
  user: any; 
  verifications: Verification[]; 
  selectedVerification: Verification | null;
  onUpgradeClick: () => void;
}) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetch('/api/stripe/subscription-status')
        .then(res => res.ok ? res.json() : null)
        .then(data => setSubscriptionStatus(data))
        .catch(err => console.error('Error loading subscription status:', err));
    }
  }, [user]);

  if (!user || verifications.length === 0 || !subscriptionStatus) {
    return null;
  }

  const formatRenewalDate = (dateString: string | null): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="lg:hidden order-3 w-full">
      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
        <h3 className="text-base font-bold text-gray-900 mb-3">Plan & Usage</h3>
        
        {subscriptionStatus.hasSubscription && (
          <div className="mb-3">
            <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(((subscriptionStatus.currentUsage || 0) / subscriptionStatus.limit) * 100, 100)}%`,
                }}
              />
            </div>
            <div className="flex items-baseline justify-between text-xs text-gray-600">
              <span>{subscriptionStatus.currentUsage || 0}/{subscriptionStatus.limit} verifications used</span>
              {subscriptionStatus.usageInfo?.periodEnd && (
                <span>Renews {formatRenewalDate(subscriptionStatus.usageInfo.periodEnd)}</span>
              )}
            </div>
          </div>
        )}
        
        {!subscriptionStatus.hasSubscription && subscriptionStatus.availableCredits !== undefined && (
          <div className="mb-3">
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-semibold text-gray-900">1 credit remaining</span>
              <span className="text-xs text-gray-500">1/1 available</span>
            </div>
          </div>
        )}
        
        {((subscriptionStatus.hasSubscription && subscriptionStatus.plan === 'starter') || !subscriptionStatus.hasSubscription) && (
          <>
            <p className="text-sm font-semibold text-gray-900 mb-2">
              {subscriptionStatus.hasSubscription ? 'Need more than 10 verifications?' : 'Subscribe and save.'}
            </p>
            <p className="text-xs text-gray-600 mb-4">
              {subscriptionStatus.hasSubscription
                ? 'Get 50 per month for $129 ($2.58 each)'
                : 'Get 50 verifications/month for $129 ($2.58 each) instead of $14.99 each.'}
            </p>
            <button
              onClick={onUpgradeClick}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
            >
              Compare Plans
            </button>
          </>
        )}
        
        {subscriptionStatus.hasSubscription && subscriptionStatus.plan === 'pro' && (
          <div className="space-y-1">
            <p className="text-sm text-gray-700">
              {subscriptionStatus.limit - (subscriptionStatus.currentUsage || 0)} credits remaining
            </p>
            {subscriptionStatus.usageInfo?.periodEnd && (
              <p className="text-xs text-gray-500">
                Renews {formatRenewalDate(subscriptionStatus.usageInfo.periodEnd)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomePageClient({ 
  initialVerifications, 
  initialLandlordInfo 
}: HomePageClientProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('new');
  const [verifications, setVerifications] = useState<Verification[]>(initialVerifications);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [landlordInfo, setLandlordInfo] = useState(initialLandlordInfo);
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);

  // Track pricing modal opens
  useEffect(() => {
    if (showPricingModal) {
      analytics.modalOpened({ modal_type: 'pricing' });
    }
  }, [showPricingModal]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signup');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{
    currentUsage: number;
    limit: number;
    plan: 'starter' | 'pro';
  } | null>(null);
  const [headerDismissed, setHeaderDismissed] = useState(false);
  const [startEditing, setStartEditing] = useState(false);
  const { toast } = useToast();

  // Listen for auth modal events from navbar
  useEffect(() => {
    const handleOpenAuthModal = (event: CustomEvent) => {
      const mode = (event.detail as { mode?: 'signin' | 'signup' })?.mode || 'signup';
      setAuthModalMode(mode);
      setShowAuthModal(true);
    };

    window.addEventListener('openAuthModal', handleOpenAuthModal as EventListener);
    return () => {
      window.removeEventListener('openAuthModal', handleOpenAuthModal as EventListener);
    };
  }, []);

  // Refresh verifications when user changes
  useEffect(() => {
    if (user) {
      loadVerifications();
    } else {
      setVerifications([]);
    }
  }, [user]);

  // Handle payment success redirect and auto-retry verification
  useEffect(() => {
    if (!user) return; // Only run if user is authenticated

    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const subscriptionStatus = params.get('subscription');
    
    // Handle both PAYG payment success and subscription success
    if (paymentStatus === 'success' || subscriptionStatus === 'success') {
      const storedData = sessionStorage.getItem('pendingVerificationData');
      if (storedData) {
        // Wait for webhook to process payment, then retry with exponential backoff
        const retryWithBackoff = async (attempt: number = 1, maxAttempts: number = 3) => {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 1s, 2s, 4s max
          
          setTimeout(async () => {
            try {
              const formData = JSON.parse(storedData);
              const response = await fetch('/api/verifications/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  individual_name: formData.individual_name,
                  individual_email: formData.individual_email,
                  requested_by_name: formData.requested_by_name,
                  requested_by_email: formData.requested_by_email,
                  purpose: formData.purpose,
                }),
              });

              const result = await response.json();

              if (!response.ok) {
                // For subscriptions: webhook might not have processed yet, retry
                // For PAYG: payment might not be available yet, retry
                if ((response.status === 402 && result.paymentRequired) || 
                    (response.status === 401 && subscriptionStatus === 'success')) {
                  // Retry if we have attempts left (subscription webhook still processing)
                  if (attempt < maxAttempts) {
                    retryWithBackoff(attempt + 1, maxAttempts);
                    return;
                  }
                }
                
                // Check if limit was reached (subscription active but over limit)
                if (response.status === 403 && result.limitReached) {
                  setLimitInfo({
                    currentUsage: result.currentUsage,
                    limit: result.limit,
                    plan: result.plan,
                  });
                  setShowLimitModal(true);
                  sessionStorage.removeItem('pendingVerificationData');
                } else {
                  // Other error or max attempts reached
                  const message = subscriptionStatus === 'success'
                    ? 'Subscription is still processing. Please wait a moment and try creating the verification again.'
                    : attempt >= maxAttempts 
                    ? 'Payment is still processing. Please wait a moment and try creating the verification again.'
                    : 'Waiting for subscription to process...';
                  
                  toast({
                    title: subscriptionStatus === 'success' ? 'Subscription Processing' : 'Payment Processing',
                    description: message,
                  });
                }
        return;
      }
      
              // Success - verification created
              setVerifications([result.verification, ...verifications]);
              setFormData({ name: '', email: '' });
              setSelectedVerification(result.verification);
              setActiveTab('all');
        
              // Clear stored data
              sessionStorage.removeItem('pendingVerificationData');
              
              const successMessage = subscriptionStatus === 'success'
                ? 'Subscription activated and verification created successfully. Click "Send Email" to notify the recipient.'
                : 'Payment processed and verification created successfully. Click "Send Email" to notify the recipient.';
              
              toast({ 
                title: 'Success!', 
                description: successMessage
              });
            } catch (error) {
              console.error('Error auto-retrying verification:', error);
              if (attempt < maxAttempts) {
                retryWithBackoff(attempt + 1, maxAttempts);
              } else {
          toast({ 
                  title: 'Error',
                  description: 'Failed to create verification. Please try again.',
                  variant: 'destructive',
                });
              }
            }
          }, delay);
        };

        retryWithBackoff();
      }
      
      // Clean up URL (remove both payment and subscription params)
      window.history.replaceState({}, '', window.location.pathname);
    } else if (paymentStatus === 'canceled' || subscriptionStatus === 'canceled') {
      // Clear stored data on cancel
      sessionStorage.removeItem('pendingVerificationData');
      toast({
        title: subscriptionStatus === 'canceled' ? 'Subscription Canceled' : 'Payment Canceled',
        description: 'You can try again when ready.',
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      }
  }, [user]);

  async function loadVerifications(): Promise<Verification[] | null> {
    if (!user) return null;
    
    setLoading(true);
    try {
      const response = await fetch('/api/verifications/list');
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Error loading verifications:', result.error);
        toast({
          title: 'Error',
          description: result.error || 'Failed to load verifications',
          variant: 'destructive',
        });
        return null;
      }
      
      if (result.verifications) {
        const verificationsData = result.verifications as Verification[];
        setVerifications(verificationsData);
        return verificationsData;
      }
      return null;
    } catch (error) {
      console.error('Error loading verifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load verifications',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function createVerification(e?: React.FormEvent) {
    if (e) {
    e.preventDefault();
    }
    
    if (!formData.name || !formData.email) return;
    
    // Require auth to create verifications
    if (!user) {
      setAuthModalMode('signup');
      setShowAuthModal(true);
      return;
    }

    setCreating(true);

    try {
      const response = await fetch('/api/verifications/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          individual_name: formData.name,
          individual_email: formData.email,
          requested_by_name: landlordInfo.name || null,
          requested_by_email: landlordInfo.email || null,
          purpose: null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Check if payment is required (402)
        if (response.status === 402 && (result.paymentRequired || result.requiresPayment)) {
          // Pay-as-you-go: payment required
          // Store form data for auto-retry after payment
          const formDataToStore = {
            individual_name: formData.name,
            individual_email: formData.email,
            requested_by_name: landlordInfo.name || null,
            requested_by_email: landlordInfo.email || null,
            purpose: null,
          };
          sessionStorage.setItem('pendingVerificationData', JSON.stringify(formDataToStore));
          
        toast({
            title: 'Payment Required', 
            description: 'Payment required to create verification. Select a payment option.',
        });
        setShowPricingModal(true);
        } else if (response.status === 403 && result.limitReached) {
          // Check if limit was reached
          setLimitInfo({
            currentUsage: result.currentUsage,
            limit: result.limit,
            plan: result.plan,
          });
          setShowLimitModal(true);
        } else {
        toast({ 
          title: 'Error', 
          description: result.error || 'Failed to create verification', 
          variant: 'destructive' 
        });
        }
      } else {
        // Subscription user - verification created, usage reported to Stripe
        setVerifications([result.verification, ...verifications]);
        setFormData({ name: '', email: '' });
        setSelectedVerification(result.verification);
        setActiveTab('all');
        
        // Clear any stored pending data (in case user manually created after payment)
        sessionStorage.removeItem('pendingVerificationData');
        
        toast({ 
          title: 'Created!', 
          description: 'Verification created successfully. Click "Send Email" to notify the recipient.' 
        });
      }
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to create verification', 
        variant: 'destructive' 
      });
    } finally {
      setCreating(false);
    }
  }


  function copyLink(token: string) {
    const link = `${window.location.origin}/verify/${token}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Copied!', description: 'Link copied to clipboard' });
  }

  async function cancelVerification(id: string) {
    try {
      const response = await fetch('/api/verifications/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: 'Error',
          description: result.message || result.error || 'Failed to cancel verification',
          variant: 'destructive',
        });
        return;
      }

      // Update verification status in local state
      setVerifications(verifications.map((v) => 
        v.id === id ? { ...v, status: 'canceled' as const } : v
      ));
      
      if (selectedVerification?.id === id) {
        setSelectedVerification({ ...selectedVerification, status: 'canceled' as const });
      }
      
      toast({ 
        title: 'Canceled', 
        description: result.creditRefunded 
          ? 'Verification canceled and credit returned' 
          : 'Verification canceled'
      });
      
      // Reload verifications to get fresh data
      await loadVerifications();
    } catch (error) {
      console.error('Error canceling verification:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel verification',
        variant: 'destructive',
      });
    }
  }

  // Stats
  const stats = {
    all: verifications.length,
    pending: verifications.filter((v) => v.status === 'pending').length,
    completed: verifications.filter((v) => v.status === 'completed').length,
    canceled: verifications.filter((v) => v.status === 'canceled').length,
  };

  const showHeader = (!user || verifications.length === 0) && !headerDismissed;
  const showTabs = user && verifications.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Header Banner */}
        {showHeader && (
          <div className="mb-6 bg-emerald-50 rounded-xl border border-emerald-100 p-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 relative z-10">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
Stop fake paystubs with bank-verified income reports.         </h1>
                <h2 className="text-lg text-gray-700 mb-4">
                Applicants connect their bank and you receive a verified earnings report with up to 12 months of income history in minutes.                </h2>
                <div className="flex flex-wrap items-center gap-4">
                  <Link 
                    href="/report/example" 
                    className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                    onClick={() => analytics.ctaClicked({ cta_name: 'See Sample Report', location: 'header' })}
                  >
                    See a sample report →
                  </Link>
                  <button
                    onClick={() => setHeaderDismissed(true)}
                    className="text-gray-600 hover:text-gray-800 font-medium text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <div className="hidden md:block flex-shrink-0">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center">
                  <FileCheck className="w-12 h-12 text-emerald-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Tabs + Content */}
          <div className="flex-1 min-w-0 order-2 lg:order-1">
            {/* Tab Bar */}
            {showTabs && (
            <div className="mb-6">
              {/* Mobile: Stacked layout */}
              <div className="flex flex-col sm:hidden gap-2 mb-4">
                <button
                  onClick={() => {
                    setActiveTab('new');
                    setSelectedVerification(null);
                  }}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    activeTab === 'new'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">New Verification</span>
                </button>
                <div className="grid grid-cols-4 gap-2">
                  {(['all', 'pending', 'completed', 'canceled'] as const).map((tab) => {
                    const labels = {
                      all: 'All',
                      pending: 'Pending',
                      completed: 'Completed',
                      canceled: 'Canceled',
                    };
                    const isActive = activeTab === tab;

                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-2 py-2 rounded-lg border-2 bg-white text-center transition-all ${
                          isActive
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`text-xs font-medium mb-0.5 ${
                          isActive 
                            ? 'text-emerald-600' 
                            : tab === 'pending' ? 'text-amber-500' : 
                              tab === 'completed' ? 'text-emerald-500' : 
                              'text-gray-500'
                        }`}>
                          {labels[tab]}
                        </div>
                        <div className={`text-base font-semibold ${
                          isActive ? 'text-gray-900' : 'text-gray-600'
                        }`}>{stats[tab]}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Desktop: Horizontal layout */}
              <div className="hidden sm:flex items-end gap-0 border-b border-gray-200">
                <button
                  onClick={() => {
                    setActiveTab('new');
                    setSelectedVerification(null);
                  }}
                  className={`flex items-center gap-2 px-5 py-3 rounded-t-lg border-t border-x transition-all relative ${
                    activeTab === 'new'
                      ? 'border-emerald-500 border-b-2 border-b-transparent bg-white text-emerald-600 shadow-sm z-10'
                      : 'border-gray-200 border-b border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-emerald-600'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">New Verification</span>
                  {activeTab === 'new' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"></div>
                  )}
                </button>

                {(['all', 'pending', 'completed', 'canceled'] as const).map((tab) => {
                  const labels = {
                    all: 'All Verifications',
                    pending: 'Pending',
                    completed: 'Completed',
                    canceled: 'Canceled',
                  };
                  const isActive = activeTab === tab;

                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 px-4 py-3 rounded-t-lg border-t border-x bg-white text-left transition-all relative ${
                        isActive
                          ? 'border-emerald-500 border-b-2 border-b-transparent bg-white shadow-sm z-10'
                          : 'border-gray-200 hover:border-gray-300 border-b border-gray-200'
                      }`}
                    >
                      <div className={`text-xs font-medium mb-1 ${
                        isActive 
                          ? 'text-emerald-600' 
                          : tab === 'pending' ? 'text-amber-500' : 
                            tab === 'completed' ? 'text-emerald-500' : 
                            'text-gray-500'
                      }`}>
                        {labels[tab]}
                      </div>
                      <div className={`text-xl font-semibold ${
                        isActive ? 'text-gray-900' : 'text-gray-600'
                      }`}>{stats[tab]}</div>
                      {isActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            )}
            
            {/* Main Content */}
            <div>
              {!showTabs || activeTab === 'new' ? (
                <NewVerificationTab
                  landlordInfo={landlordInfo}
                  setLandlordInfo={setLandlordInfo}
                  formData={formData}
                  setFormData={setFormData}
                  creating={creating}
                  onSubmit={createVerification}
                />
              ) : (
                <VerificationsListTab
                  verifications={verifications}
                  selectedVerification={selectedVerification}
                  onSelect={setSelectedVerification}
                  onCopyLink={copyLink}
                  onDelete={(id) => {
                    cancelVerification(id);
                    setSelectedVerification(null);
                  }}
                  onEdit={(verification) => {
                    setSelectedVerification(verification);
                    setStartEditing(true);
                    // Reset after a brief moment to allow the sidebar to react
                    setTimeout(() => setStartEditing(false), 100);
                  }}
                  loading={loading}
                  filter={activeTab}
                />
              )}
            </div>
          </div>
          
          {/* Plan & Usage - Mobile Only (shown after main content) */}
          {user && verifications.length > 0 && (
            <PlanAndUsageMobile 
              user={user}
              verifications={verifications}
              selectedVerification={selectedVerification}
              onUpgradeClick={() => {
                analytics.ctaClicked({ cta_name: 'Compare Plans', location: 'sidebar' });
                setShowPricingModal(true);
              }}
            />
          )}
          
          {/* Sidebar */}
          <div className="w-full lg:w-[340px] flex-shrink-0 order-1 lg:order-2 flex flex-col lg:block">
            <div className="lg:sticky lg:top-6 flex flex-col gap-4">
              {user && verifications.length > 0 ? (
                <ActionsSidebar
                  selectedVerification={selectedVerification}
                  onCopyLink={copyLink}
                  onDelete={(id) => {
                    cancelVerification(id);
                    setSelectedVerification(null);
                  }}
                  onUpgradeClick={() => {
                    analytics.ctaClicked({ cta_name: 'Compare Plans', location: 'actions_sidebar' });
                    setShowPricingModal(true);
                  }}
                  startEditing={startEditing}
                  onEmailSent={async () => {
                    // Refresh verifications to get updated last_email_sent_at
                    if (user) {
                      const updatedVerifications = await loadVerifications();
                      // Update selected verification if it's the one we just sent email for
                      if (selectedVerification && updatedVerifications) {
                        const updated = updatedVerifications.find(v => v.id === selectedVerification.id);
                        if (updated) setSelectedVerification(updated);
                      }
                    }
                  }}
                />
              ) : (
              <div className="space-y-8 bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col">
                {/* How it works */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">How it works</h3>
                  <div className="space-y-6 relative">
                    {/* Vertical line connector */}
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />
                    
                    <div className="flex items-start gap-4 relative">
                      <span className="flex-shrink-0 w-6 h-6 bg-white border border-gray-300 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold z-10">
                        1
                      </span>
                      <div>
                        <span className="text-gray-900 font-medium block text-sm leading-none mb-1">Invite</span>
                        <span className="text-sm text-gray-600">Send a secure link to the individual.</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 relative">
                      <span className="flex-shrink-0 w-6 h-6 bg-white border border-gray-300 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold z-10">
                        2
                      </span>
                      <div>
                        <span className="text-gray-900 font-medium block text-sm leading-none mb-1">Connect</span>
                        <span className="text-sm text-gray-600">Recipient securely links their bank account.</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 relative">
                      <span className="flex-shrink-0 w-6 h-6 bg-white border border-gray-300 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold z-10">
                        3
                      </span>
                      <div>
                        <span className="text-gray-900 font-medium block text-sm leading-none mb-1">Analyze</span>
                        <span className="text-sm text-gray-600">View the complete income verification report in your dashboard.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* What you get */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 tracking-tight">What you get</h3>
                  <ul className="space-y-5">
                    <li className="flex items-start gap-4">
                      <div className="mt-1 bg-emerald-500/10 p-1 rounded-md flex-shrink-0">
                        <Check className="w-4 h-4 text-emerald-500" strokeWidth={3} />
                      </div>
                      <div>
                        <span className="text-gray-900 font-semibold block leading-tight">Bank-Verified Income</span>
                        <span className="text-sm text-gray-600 leading-relaxed">Income is verified directly from connected financial accounts.</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="mt-1 bg-emerald-500/10 p-1 rounded-md flex-shrink-0">
                        <Check className="w-4 h-4 text-emerald-500" strokeWidth={3} />
                      </div>
                      <div>
                        <span className="text-gray-900 font-semibold block leading-tight">Fraud Prevention</span>
                        <span className="text-sm text-gray-600 leading-relaxed">Eliminate the risk of doctored or forged PDF documents.</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="mt-1 bg-emerald-500/10 p-1 rounded-md flex-shrink-0">
                        <Check className="w-4 h-4 text-emerald-500" strokeWidth={3} />
                      </div>
                      <div>
                        <span className="text-gray-900 font-semibold block leading-tight">Clear report in minutes</span>
                        <span className="text-sm text-gray-600 leading-relaxed">12-month income history, deposit patterns, and payroll frequency.</span>
                        <Link 
                          href="/report/example" 
                          className="text-xs text-emerald-600 hover:text-emerald-700 mt-1 inline-block"
                          onClick={() => analytics.ctaClicked({ cta_name: 'See Example Report', location: 'form_footer' })}
                        >
                          See example report →
                        </Link>
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Pricing */}
                <div className="mt-auto pt-6 border-t border-gray-200 relative">
                  {/* Decorative sparkle */}
                  <div className="absolute right-0 bottom-8 text-gray-300/50 text-5xl">✦</div>
                  
                  <h3 className="text-sm font-semibold text-gray-500 mb-3">Pricing</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900">$14.99</span>
                    <span className="text-gray-600 text-sm ml-1">per successful<br />verification</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-6">
                    Pay as you go. No subscription required.
                  </p>
                  
                  <p className="text-sm text-gray-600 mb-6">
                    <span className="font-semibold text-gray-900">Need volume?</span> Save with{' '}
                    <button
                      onClick={() => setShowPricingModal(true)}
                      className="underline hover:text-gray-900 cursor-pointer"
                    >
                      monthly plans
                    </button>
                    <br />(starting at just $4/verification).
                  </p>
                  
                  <div className="flex items-center gap-2 text-gray-500">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-xs">256-bit encryption</span>
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
      </div>

          {/* Auth Modal */}
          <AuthModal 
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            initialMode={authModalMode}
            initialEmail={landlordInfo.email || ''}
            initialCompanyName={landlordInfo.name || ''}
            onAuthSuccess={async () => {
              // Check if there's a pending checkout after successful auth
              const pendingCheckout = sessionStorage.getItem('pendingCheckout');
              if (pendingCheckout) {
                sessionStorage.removeItem('pendingCheckout');
                
                // Small delay to ensure auth state is updated
                setTimeout(async () => {
                  try {
                    let response;
                    if (pendingCheckout === 'per_verification') {
                      response = await fetch('/api/stripe/create-one-time-checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                      });
                    } else {
                      response = await fetch('/api/stripe/create-checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ plan: pendingCheckout }),
                      });
                    }

                    const data = await response.json();

                    if (response.ok && data.url) {
                      window.location.href = data.url;
                    } else {
                      toast({
                        title: 'Error',
                        description: data.error || 'Failed to create checkout session',
                        variant: 'destructive',
                      });
                    }
                  } catch (error) {
                    toast({
                      title: 'Error',
                      description: 'Failed to start checkout. Please try again.',
                      variant: 'destructive',
                    });
                  }
                }, 500);
              }
            }}
          />

      {/* Pricing Modal */}
      <PricingModal 
        isOpen={showPricingModal} 
        onClose={() => {
          setShowPricingModal(false);
        }}
      />

      {/* Limit Reached Modal */}
      {limitInfo && (
        <LimitReachedModal
          isOpen={showLimitModal}
          onClose={() => {
            setShowLimitModal(false);
            setLimitInfo(null);
          }}
          currentUsage={limitInfo.currentUsage}
          limit={limitInfo.limit}
          plan={limitInfo.plan}
          onOneOffPurchase={async () => {
            // Retry verification creation after one-off purchase
            // The payment will be handled by the modal, then we retry
            setShowLimitModal(false);
            // User will need to retry verification creation after payment
            toast({
              title: 'Payment Required',
              description: 'Complete payment to create verification',
            });
          }}
        />
      )}
    </div>
  );
}

