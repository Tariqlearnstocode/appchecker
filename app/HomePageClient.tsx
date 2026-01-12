'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/ui/Toasts/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, X, Check, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { Verification } from '@/components/VerificationsTable';
import { NewVerificationTab } from '@/components/NewVerificationTab';
import { VerificationsListTab } from '@/components/VerificationsListTab';
import { ActionsSidebar } from '@/components/ActionsSidebar';
import { PricingModal } from '@/components/ui/Pricing';
import type { User as SupabaseUser } from '@supabase/supabase-js';

type ActiveTab = 'new' | 'all' | 'pending' | 'completed' | 'expired';
type AuthMode = 'signin' | 'signup';

interface HomePageClientProps {
  initialUser: SupabaseUser | null;
  initialVerifications: Verification[];
  initialLandlordInfo: { name: string; email: string };
}

export default function HomePageClient({ 
  initialUser, 
  initialVerifications, 
  initialLandlordInfo 
}: HomePageClientProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('new');
  const [verifications, setVerifications] = useState<Verification[]>(initialVerifications);
  const [loading, setLoading] = useState(false); // Start false - we have initial data
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [landlordInfo, setLandlordInfo] = useState(initialLandlordInfo);
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(initialUser);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingModalFromPayment, setPricingModalFromPayment] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();
  const router = useRouter();

  // Store refs for pending verification data to avoid stale closures
  const pendingVerificationRef = useRef(false);
  const formDataRef = useRef(formData);
  const landlordInfoRef = useRef(landlordInfo);
  
  // Keep refs in sync
  useEffect(() => {
    pendingVerificationRef.current = pendingVerification;
    formDataRef.current = formData;
    landlordInfoRef.current = landlordInfo;
  }, [pendingVerification, formData, landlordInfo]);

  // Listen for auth modal events from navbar
  useEffect(() => {
    const handleOpenAuthModal = (event: CustomEvent) => {
      const mode = (event.detail as { mode?: 'signin' | 'signup' })?.mode || 'signup';
      setAuthMode(mode);
      setShowAuthModal(true);
      setAuthError('');
    };

    window.addEventListener('openAuthModal', handleOpenAuthModal as EventListener);
    return () => {
      window.removeEventListener('openAuthModal', handleOpenAuthModal as EventListener);
    };
  }, []);

  // Fetch user data after sign in
  async function loadUserData(currentUser: SupabaseUser) {
    // Fetch verifications
    const { data: verificationsData } = await supabase
      .from('income_verifications')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });
    
    if (verificationsData) {
      setVerifications(verificationsData);
    }
    
    // Fetch profile for landlord defaults
    const { data: profile } = await supabase
      .from('users')
      .select('company_name')
      .eq('id', currentUser.id)
      .single();
    
    setLandlordInfo({
      name: (profile as { company_name?: string | null } | null)?.company_name || '',
      email: currentUser.email || ''
    });
  }

  // Only listen for auth CHANGES (sign in/out), not initial load
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setVerifications([]);
        setLandlordInfo({ name: '', email: '' });
        return;
      }
      
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        setShowAuthModal(false);
        setAuthError('');
        setAuthEmail('');
        setAuthPassword('');
        
        // Fetch user's data client-side
        await loadUserData(session.user);
        
        // If there was a pending verification, show success message and keep form pre-filled
        if (pendingVerificationRef.current && formDataRef.current.name && formDataRef.current.email) {
          setPendingVerification(false);
          // Switch to new tab to show the form
          setActiveTab('new');
          toast({ 
            title: 'Account created!', 
            description: 'Your form is ready. Click "Create Verification" to continue.' 
          });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, toast]);

  async function createVerification(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.name || !formData.email) return;
    
    // Require auth to create verifications
    if (!user) {
      setPendingVerification(true);
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

      if (response.status === 402) {
        // Payment required - show pricing modal with payment flow enabled
        const paymentType = result.paymentType === 'overage' ? 'overage' : 'per_verification';
        
        // If overage, go directly to checkout (no choice needed - they're already subscribed)
        if (paymentType === 'overage') {
          const checkoutResponse = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              priceType: 'overage',
              amountCents: result.amountCents,
            }),
          });
          
          const checkoutResult = await checkoutResponse.json();
          
          if (checkoutResponse.ok && checkoutResult.url) {
            window.location.href = checkoutResult.url;
          } else {
            toast({
              title: 'Payment Error',
              description: 'Failed to initiate payment. Please try again.',
              variant: 'destructive',
            });
          }
        } else {
          // For per_verification, show pricing modal with payment flow enabled
          setPricingModalFromPayment(true);
          setShowPricingModal(true);
        }
      } else if (!response.ok) {
        toast({ 
          title: 'Error', 
          description: result.error || 'Failed to create verification', 
          variant: 'destructive' 
        });
      } else {
        setVerifications([result.verification, ...verifications]);
        setFormData({ name: '', email: '' });
        setSelectedVerification(result.verification);
        setActiveTab('all');
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

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: {
              company_name: landlordInfo.name,
              contact_email: landlordInfo.email || authEmail,
            }
          }
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setAuthError(error.message || 'Authentication failed');
    }
    setAuthLoading(false);
  }

  function closeAuthModal() {
    setShowAuthModal(false);
    setPendingVerification(false);
    setAuthError('');
    setAuthEmail('');
    setAuthPassword('');
  }

  function copyLink(token: string) {
    const link = `${window.location.origin}/verify/${token}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Copied!', description: 'Link copied to clipboard' });
  }

  async function deleteVerification(id: string) {
    const { error } = await supabase.from('income_verifications').delete().eq('id', id);
    if (!error) {
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
      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {authMode === 'signup' ? 'Create your account' : 'Welcome back'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {authMode === 'signup' 
                    ? 'Sign up to create your verification request' 
                    : 'Sign in to continue'}
                </p>
              </div>
              <button onClick={closeAuthModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="p-6 space-y-4">
              {authError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {authError}
                </div>
              )}
              
              <div>
                <label htmlFor="auth-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="auth-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder={authMode === 'signup' ? 'Create a password' : 'Your password'}
                  autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {authLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {authMode === 'signup' ? 'Create Account & Continue' : 'Sign In & Continue'}
              </button>
            </form>

            <div className="px-6 pb-6 text-center">
              <p className="text-sm text-gray-500">
                {authMode === 'signup' ? (
                  <>
                    Already have an account?{' '}
                    <button
                      onClick={() => { setAuthMode('signin'); setAuthError(''); }}
                      className="text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Sign in
                    </button>
                  </>
                ) : (
                  <>
                    Don&apos;t have an account?{' '}
                    <button
                      onClick={() => { setAuthMode('signup'); setAuthError(''); }}
                      className="text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Create one
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

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
            <div className={user ? '' : 'sticky top-6'}>
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
                    setPricingModalFromPayment(false);
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

      {/* Pricing Modal */}
      <PricingModal 
        isOpen={showPricingModal} 
        onClose={() => {
          setShowPricingModal(false);
          setPricingModalFromPayment(false);
        }}
        fromPaymentFlow={pricingModalFromPayment}
      />
    </div>
  );
}

