'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toasts/use-toast';
import Link from 'next/link';
import { Plus, Check, ShieldCheck } from 'lucide-react';
import { Verification } from '@/components/VerificationsTable';
import { NewVerificationTab } from '@/components/NewVerificationTab';
import { VerificationsListTab } from '@/components/VerificationsListTab';
import { ActionsSidebar } from '@/components/ActionsSidebar';
import { PricingModal } from '@/components/ui/Pricing';
import { AuthModal } from '@/components/AuthModal';
import { LimitReachedModal } from '@/components/LimitReachedModal';
import { useAuth } from '@/contexts/AuthContext';

type ActiveTab = 'new' | 'all' | 'pending' | 'completed' | 'expired';

interface HomePageClientProps {
  initialVerifications: Verification[];
  initialLandlordInfo: { name: string; email: string };
}

export default function HomePageClient({ 
  initialVerifications, 
  initialLandlordInfo 
}: HomePageClientProps) {
  const { user, supabase } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('new');
  const [verifications, setVerifications] = useState<Verification[]>(initialVerifications);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [landlordInfo, setLandlordInfo] = useState(initialLandlordInfo);
  
  // Log client-side auth state and initial props
  console.log('[ClientAuth] HomePageClient: user from useAuth():', user?.id || 'null', 'email:', user?.email || 'null');
  console.log('[ClientAuth] HomePageClient: initialLandlordInfo prop:', initialLandlordInfo);
  console.log('[ClientAuth] HomePageClient: initialVerifications count:', initialVerifications.length);
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signup');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{
    currentUsage: number;
    limit: number;
    plan: 'starter' | 'pro';
  } | null>(null);
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
    
    if (paymentStatus === 'success') {
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
                // Payment still not available - retry if we have attempts left
                if (response.status === 402 && result.paymentRequired && attempt < maxAttempts) {
                  retryWithBackoff(attempt + 1, maxAttempts);
                  return;
                }
                
                // Check if limit was reached
                if (response.status === 403 && result.limitReached) {
                  setLimitInfo({
                    currentUsage: result.currentUsage,
                    limit: result.limit,
                    plan: result.plan,
                  });
                  setShowLimitModal(true);
                  sessionStorage.removeItem('pendingVerificationData');
                } else {
                  toast({
                    title: 'Payment Processing',
                    description: attempt >= maxAttempts 
                      ? 'Payment is still processing. Please wait a moment and try creating the verification again.'
                      : 'Waiting for payment to process...',
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
              
              toast({ 
                title: 'Success!', 
                description: 'Payment processed and verification created successfully. Click "Send Email" to notify the recipient.' 
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
      
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (paymentStatus === 'canceled') {
      // Clear stored data on cancel
      sessionStorage.removeItem('pendingVerificationData');
      toast({
        title: 'Payment Canceled',
        description: 'You can try again when ready.',
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user]);

  async function loadVerifications() {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data } = await supabase
        .from('income_verifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) {
        setVerifications(data as Verification[]);
      }
    } catch (error) {
      console.error('Error loading verifications:', error);
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

  async function deleteVerification(id: string) {
    const { error } = await supabase.from('income_verifications').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message || 'Failed to delete verification', variant: 'destructive' });
    } else {
      setVerifications(verifications.filter((v) => v.id !== id));
      if (selectedVerification?.id === id) setSelectedVerification(null);
      toast({ title: 'Deleted', description: 'Verification removed' });
    }
  }

  // Stats
  const stats = {
    all: verifications.length,
    pending: verifications.filter((v) => v.status === 'pending').length,
    completed: verifications.filter((v) => v.status === 'completed').length,
    expired: verifications.filter((v) => v.status === 'expired').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Column - Tabs + Content */}
          <div className="flex-1 min-w-0">
            {/* Tab Bar */}
            <div className="flex items-stretch gap-3 mb-6">
            <button
              onClick={() => setActiveTab('new')}
              className={`flex items-center gap-2 px-5 py-4 rounded-lg border transition-all ${
                activeTab === 'new'
                  ? 'border-emerald-500 bg-white text-emerald-600'
                  : 'border-dashed border-gray-300 bg-white text-gray-600 hover:border-emerald-400 hover:text-emerald-600'
              }`}
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">New Verification</span>
            </button>

            {(['all', 'pending', 'completed', 'expired'] as const).map((tab) => {
              const labels = {
                all: 'All Verifications',
                pending: 'Pending',
                completed: 'Completed',
                expired: 'Expired',
              };
              const isActive = activeTab === tab;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-3 rounded-lg border bg-white text-left transition-all ${
                    isActive
                      ? 'border-emerald-500 ring-1 ring-emerald-100'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`text-xs mb-1 ${
                    tab === 'pending' ? 'text-amber-500' : 
                    tab === 'completed' ? 'text-emerald-500' : 
                    'text-gray-500'
                  }`}>
                    {labels[tab]}
                  </div>
                  <div className="text-xl font-semibold text-gray-900">{stats[tab]}</div>
                </button>
              );
            })}
            </div>
            
            {/* Main Content */}
            <div>
              {activeTab === 'new' ? (
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
                    deleteVerification(id);
                    setSelectedVerification(null);
                  }}
                  loading={loading}
                  filter={activeTab}
                />
              )}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="w-[340px] flex-shrink-0">
            <div className="sticky top-6">
              {user ? (
                <ActionsSidebar
                  selectedVerification={selectedVerification}
                  onCopyLink={copyLink}
                  onDelete={(id) => {
                    deleteVerification(id);
                    setSelectedVerification(null);
                  }}
                  onUpgradeClick={() => {
                    setShowPricingModal(true);
                  }}
                  onEmailSent={async () => {
                    // Refresh verifications to get updated last_email_sent_at
                    if (user) {
                      const { data: verificationsData } = await supabase
                        .from('income_verifications')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false });
                      
                      if (verificationsData) {
                        setVerifications(verificationsData as Verification[]);
                        // Update selected verification if it's the one we just sent email for
                        if (selectedVerification) {
                          const updated = (verificationsData as Verification[]).find(v => v.id === selectedVerification.id);
                          if (updated) setSelectedVerification(updated);
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div className="space-y-8 bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col">
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
                          <Link href="/report/example" className="text-xs text-emerald-600 hover:text-emerald-700 mt-1 inline-block">
                            See example report →
                          </Link>
                        </div>
                      </li>
                    </ul>
                  </div>

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

