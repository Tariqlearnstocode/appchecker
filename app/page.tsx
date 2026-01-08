'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/ui/Toasts/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, FileCheck, Settings, Crown, LogOut, User, Loader2, X } from 'lucide-react';
import { Verification } from '@/components/VerificationsTable';
import { NewVerificationTab } from '@/components/NewVerificationTab';
import { VerificationsListTab } from '@/components/VerificationsListTab';
import { ActionsSidebar } from '@/components/ActionsSidebar';

type ActiveTab = 'new' | 'all' | 'pending' | 'completed' | 'expired';
type AuthMode = 'signin' | 'signup';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('new');
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [landlordInfo, setLandlordInfo] = useState({ name: '', email: '' });
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function init() {
      // Check auth status
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Load defaults from users table
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('company_name')
          .eq('id', user.id)
          .single() as { data: { company_name: string | null } | null };
        
        const companyName = profile?.company_name || '';
        setLandlordInfo({ name: companyName, email: user.email || '' });
        fetchVerifications(user);
      } else {
        setLoading(false);
        }
    }
    init();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        // Load landlord info from users table
        const { data: profile } = await supabase
          .from('users')
          .select('company_name')
          .eq('id', session.user.id)
          .single() as { data: { company_name: string | null } | null };
        
        const companyName = profile?.company_name || '';
        setLandlordInfo({ name: companyName, email: session.user.email || '' });
        setShowAuthModal(false);
        setAuthError('');
        setAuthEmail('');
        setAuthPassword('');
        fetchVerifications(session.user);
        
        // If there was a pending verification, create it now
        if (pendingVerification && formData.name && formData.email) {
          setPendingVerification(false);
          const { data, error } = await supabase
            .from('income_verifications')
            .insert({
              applicant_name: formData.name,
              applicant_email: formData.email,
              landlord_name: landlordInfo.name || null,
              landlord_email: landlordInfo.email || session.user.email || null,
              user_id: session.user.id,
            })
            .select()
            .single();

          if (!error && data) {
            setVerifications((prev) => [data, ...prev]);
            setFormData({ name: '', email: '' });
            setSelectedVerification(data);
            setActiveTab('all'); // Switch to all verifications tab
            toast({ title: 'Created!', description: 'Verification request created. Copy the link to send!' });
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setVerifications([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [pendingVerification, formData, landlordInfo]);

  async function fetchVerifications(currentUser: any) {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    
    const { data, error } = await supabase
      .from('income_verifications')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setVerifications(data);
    }
    setLoading(false);
  }

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

    const { data, error } = await supabase
      .from('income_verifications')
      .insert({
        applicant_name: formData.name,
        applicant_email: formData.email,
        landlord_name: landlordInfo.name || null,
        landlord_email: landlordInfo.email || null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: 'Failed to create verification', variant: 'destructive' });
    } else if (data) {
      setVerifications([data, ...verifications]);
      setFormData({ name: '', email: '' });
      setSelectedVerification(data);
      setActiveTab('all'); // Switch to all verifications tab
      toast({ title: 'Created!', description: 'Verification request created. Copy the link to send!' });
    }
    setCreating(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    setVerifications([]);
    toast({ title: 'Signed out', description: 'You have been signed out' });
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'signup') {
        // Sign up and save landlord info to user metadata
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
        // Close modal immediately on successful sign-in
        closeAuthModal();
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
      {/* Auth Modal - Inline Sign Up/Sign In */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
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

            {/* Form */}
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

            {/* Toggle */}
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
                    Don't have an account?{' '}
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

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900">Income Verifier</span>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 bg-gray-50 rounded-lg">
                    <User className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
              </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setAuthMode('signin'); setShowAuthModal(true); }}
                    className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Get Started
                  </button>
                </>
              )}
              <Link href="/settings" className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                <Settings className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Tab Bar - spans main content width */}
          <div className="col-span-8 flex items-stretch gap-3 mb-2">
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
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs ${
                      tab === 'pending' ? 'text-amber-500' : 
                      tab === 'completed' ? 'text-emerald-500' : 
                      'text-gray-500'
                    }`}>
                      {labels[tab]}
                    </span>
                  </div>
                  <div className="text-xl font-semibold text-gray-900">{stats[tab]}</div>
                  <div className="text-xs text-gray-400">{stats[tab] === 1 ? '1 verification' : `${stats[tab]} verifications`}</div>
                </button>
              );
            })}
          </div>
          
          {/* Empty space for sidebar alignment */}
          <div className="col-span-4"></div>
          {/* Main Content */}
          <div className="col-span-8">
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

          {/* Sidebar */}
          <div className="col-span-4">
            <ActionsSidebar
              selectedVerification={selectedVerification}
              onCopyLink={copyLink}
              onDelete={(id) => {
                deleteVerification(id);
                setSelectedVerification(null);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
