'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, FileText, CreditCard, Puzzle, ExternalLink, Loader2, Info, Shield, Download, Trash2, AlertTriangle, Coins } from 'lucide-react';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';

type SettingsTab = 'account' | 'defaults' | 'subscription' | 'integrations' | 'privacy';

interface VerificationDefaults {
  companyName: string;
  email: string;
}

interface CreditInfo {
  creditsRemaining: number;
  creditsUsedThisPeriod: number;
  subscriptionTier: string | null;
  periodStart: string | null;
  periodEnd: string | null;
}

interface SubscriptionInfo {
  tier: string | null;
  status: string | null;
  creditsIncluded: number | null;
  currentPeriodEnd: string | null;
}

function SettingsPageContent() {
  const router = useRouter();
  const { user, loading: loadingUser, supabase } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [defaults, setDefaults] = useState<VerificationDefaults>({ companyName: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const { toast } = useToast();

  // Load user data when user is available
  useEffect(() => {
    async function init() {
      if (loadingUser) return; // Wait for auth to load
      
      if (!user) {
        // Redirect to sign in if not logged in
        router.push('/signin?redirect=/settings');
        return;
      }

      // Load from users table
      const { data: profile } = await supabase
        .from('users')
        .select('company_name')
        .eq('id', user.id)
        .single() as { data: { company_name: string | null } | null };
      
      setDefaults({ 
        companyName: profile?.company_name || '', 
        email: user.email || '' 
      });
      
      // Load credit and subscription info
      loadCreditInfo(user.id);
    }
    init();
  }, [user, loadingUser, router, supabase]);

  async function loadCreditInfo(userId: string) {
    setLoadingCredits(true);
    try {
      // Load credits
      const { data: credits } = await supabase
        .from('user_credits')
        .select('credits_remaining, credits_used_this_period, subscription_tier, period_start, period_end')
        .eq('user_id', userId)
        .single() as { data: {
          credits_remaining: number;
          credits_used_this_period: number;
          subscription_tier: string | null;
          period_start: string | null;
          period_end: string | null;
        } | null };
      
      if (credits) {
        setCreditInfo({
          creditsRemaining: credits.credits_remaining,
          creditsUsedThisPeriod: credits.credits_used_this_period,
          subscriptionTier: credits.subscription_tier,
          periodStart: credits.period_start,
          periodEnd: credits.period_end,
        });
      }
      
      // Load subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('tier, status, credits_included, current_period_end')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single() as { data: {
          tier: string | null;
          status: string | null;
          credits_included: number | null;
          current_period_end: string | null;
        } | null };
      
      if (subscription) {
        setSubscriptionInfo({
          tier: subscription.tier,
          status: subscription.status,
          creditsIncluded: subscription.credits_included,
          currentPeriodEnd: subscription.current_period_end,
        });
      }
    } catch (error) {
      console.error('Error loading credit info:', error);
    } finally {
      setLoadingCredits(false);
    }
  }

  async function saveDefaults() {
    if (!user) {
      toast({ title: 'Error', description: 'You must be signed in to save defaults', variant: 'destructive' });
      return;
    }
    
    setSaving(true);

    // Save to users table
    const { error } = await supabase
      .from('users')
      .update({ company_name: defaults.companyName } as any)
      .eq('id', user.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to save preferences', variant: 'destructive' });
    } else {
      toast({ title: 'Saved!', description: 'Your defaults have been saved.' });
    }
    
    setSaving(false);
  }

  const tabs = [
    { id: 'account' as const, label: 'Account Details', icon: User },
    { id: 'defaults' as const, label: 'Verification Defaults', icon: FileText },
    { id: 'subscription' as const, label: 'Manage Subscription', icon: CreditCard, external: true },
    { id: 'integrations' as const, label: 'Integrations', icon: Puzzle },
    { id: 'privacy' as const, label: 'Privacy & Data', icon: Shield },
  ];

  async function exportData() {
    setExporting(true);
    try {
      const response = await fetch('/api/gdpr/export');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: 'Export Complete', description: 'Your data has been downloaded.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to export data', variant: 'destructive' });
    }
    setExporting(false);
  }

  async function deleteAllData() {
    setDeleting(true);
    try {
      const response = await fetch('/api/gdpr/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE_ALL_MY_DATA' }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast({ title: 'Data Deleted', description: 'All your data has been permanently deleted.' });
        // Sign out and redirect
        await supabase.auth.signOut();
        window.location.href = '/';
      } else {
        throw new Error(result.error || 'Deletion failed');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete data', variant: 'destructive' });
    }
    setDeleting(false);
    setShowDeleteConfirm(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500 -ml-1 pl-5'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                    {tab.external && <ExternalLink className="w-4 h-4 ml-auto" />}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'account' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900">My Account</h2>
                <p className="text-gray-500 mt-1">Manage your profile, email, and account status.</p>

                {loadingUser ? (
                  <div className="mt-6 flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : user ? (
                  <>
                    {/* Logged in user */}
                    <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="flex gap-3">
                        <User className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-emerald-700">Signed in as</p>
                          <p className="text-emerald-600 text-sm">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Anonymous user */
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex gap-3">
                      <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-700">No account? No problem.</p>
                        <p className="text-blue-600 text-sm mt-1">
                          You can use Income Verifier without creating an account. We'll keep your verifications 
                          locally in your browser, but they can be cleared if you change devices or wipe browser storage.
                        </p>
                        <p className="text-blue-600 text-sm mt-2">
                          <a href="/signin" className="underline font-medium">
                            Create a free account to sync your data securely across devices.
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {user ? (
                  <div className="mt-6">
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut();
                        router.push('/');
                      }}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                <div className="mt-6">
                  <Link
                    href="/signin"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                  >
                    Log in / Sign up
                  </Link>
                </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-gray-600">
                    Need more features? Unlock <span className="font-semibold">PRO</span> for email sending, 
                    reminders, and more.{' '}
                    <button
                      onClick={() => setActiveTab('subscription')}
                      className="text-emerald-600 font-medium hover:underline"
                    >
                      See PRO offer.
                    </button>
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'defaults' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900">Verification Defaults</h2>
                <p className="text-gray-500 mt-1">
                  These values prefill your verifications. You can still change them per-verification.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <input
                        type="text"
                        value={defaults.companyName}
                        onChange={(e) => setDefaults({ ...defaults, companyName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder-gray-400"
                        placeholder="Your / Company Name *"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        value={defaults.email}
                        onChange={(e) => setDefaults({ ...defaults, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder-gray-400"
                        placeholder="name@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500">Upload Logo</p>
                      <p className="text-xs text-gray-400 mt-1">Coming soon</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={saveDefaults}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white font-medium rounded-lg transition-colors"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Defaults
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'subscription' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                {loadingCredits ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <>
                    {/* Credit Balance Section */}
                    <div className="mb-8 p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Coins className="w-5 h-5 text-emerald-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Credit Balance</h3>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-emerald-600">
                              {creditInfo?.creditsRemaining ?? 0}
                            </span>
                            <span className="text-gray-600">credits remaining</span>
                          </div>
                          {subscriptionInfo && (
                            <p className="text-sm text-gray-600 mt-2">
                              {subscriptionInfo.creditsIncluded ? (
                                <>
                                  {creditInfo?.creditsUsedThisPeriod ?? 0} of {subscriptionInfo.creditsIncluded} used this period
                                  {creditInfo?.periodEnd && (
                                    <span className="ml-2">
                                      • Resets {new Date(creditInfo.periodEnd).toLocaleDateString()}
                                    </span>
                                  )}
                                </>
                              ) : (
                                'Pay-as-you-go plan'
                              )}
                            </p>
                          )}
                        </div>
                        {!subscriptionInfo && (
                          <div className="text-right">
                            <p className="text-sm text-gray-600 mb-1">Current Plan</p>
                            <p className="text-lg font-semibold text-gray-900">Pay-as-you-go</p>
                            <p className="text-xs text-gray-500">$14.99 per verification</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Subscription Info */}
                    {subscriptionInfo && (
                      <div className="mb-8 p-6 border border-gray-200 rounded-xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Subscription</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Plan</p>
                            <p className="text-lg font-semibold text-gray-900 capitalize">
                              {subscriptionInfo.tier === 'starter' ? 'Starter' : subscriptionInfo.tier === 'pro' ? 'Pro' : subscriptionInfo.tier}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <p className="text-lg font-semibold text-emerald-600 capitalize">
                              {subscriptionInfo.status}
                            </p>
                          </div>
                          {subscriptionInfo.currentPeriodEnd && (
                            <div className="col-span-2">
                              <p className="text-sm text-gray-600">Next Billing Date</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {new Date(subscriptionInfo.currentPeriodEnd).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Pricing Cards */}
                    <div className="text-center max-w-2xl mx-auto">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {subscriptionInfo ? 'Upgrade Your Plan' : 'Choose Your Plan'}
                      </h2>
                      <p className="text-gray-500 mb-8">
                        {subscriptionInfo ? 'Switch to a plan that better fits your needs.' : 'Unlock more features and verify with ease by upgrading your plan.'}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Pay-as-you-go */}
                        <div className={`border-2 rounded-xl p-6 text-left ${!subscriptionInfo ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
                          <p className="font-medium text-gray-900">Pay-as-you-go</p>
                          <div className="mt-2">
                            <span className="text-3xl font-bold text-gray-900">$14.99</span>
                            <span className="text-gray-500 text-sm"> / verification</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">No subscription required</p>
                          {!subscriptionInfo && (
                            <span className="inline-block mt-3 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                              Current Plan
                            </span>
                          )}
                        </div>

                        {/* Starter */}
                        <div className={`border-2 rounded-xl p-6 text-left ${subscriptionInfo?.tier === 'starter' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
                          {subscriptionInfo?.tier === 'starter' && (
                            <span className="absolute top-3 right-3 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                              Current
                            </span>
                          )}
                          <p className="font-medium text-gray-900">Starter</p>
                          <div className="mt-2">
                            <span className="text-3xl font-bold text-gray-900">$59</span>
                            <span className="text-gray-500 text-sm"> / month</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">10 verifications included</p>
                          <p className="text-xs text-gray-400 mt-1">$8.99 overage per verification</p>
                          <button
                            onClick={async () => {
                              const response = await fetch('/api/stripe/checkout', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ priceType: 'starter' }),
                              });
                              const result = await response.json();
                              if (result.url) {
                                window.location.href = result.url;
                              }
                            }}
                            className="mt-4 w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                          >
                            {subscriptionInfo?.tier === 'starter' ? 'Manage' : 'Subscribe'}
                          </button>
                        </div>

                        {/* Pro */}
                        <div className={`border-2 rounded-xl p-6 text-left relative ${subscriptionInfo?.tier === 'pro' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
                          {subscriptionInfo?.tier === 'pro' && (
                            <span className="absolute top-3 right-3 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                              Current
                            </span>
                          )}
                          <span className="absolute top-3 left-3 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                            Popular
                          </span>
                          <p className="font-medium text-gray-900 mt-6">Pro</p>
                          <div className="mt-2">
                            <span className="text-3xl font-bold text-gray-900">$199</span>
                            <span className="text-gray-500 text-sm"> / month</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">50 verifications included</p>
                          <p className="text-xs text-gray-400 mt-1">$4.99 overage per verification</p>
                          <button
                            onClick={async () => {
                              const response = await fetch('/api/stripe/checkout', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ priceType: 'pro' }),
                              });
                              const result = await response.json();
                              if (result.url) {
                                window.location.href = result.url;
                              }
                            }}
                            className="mt-4 w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                          >
                            {subscriptionInfo?.tier === 'pro' ? 'Manage' : 'Subscribe'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900">Integrations</h2>
                <p className="text-gray-500 mt-1">Connect Income Verifier with other tools.</p>

                <div className="mt-6 p-8 border-2 border-dashed border-gray-200 rounded-lg text-center">
                  <Puzzle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No integrations available yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Integrations with property management tools are coming soon.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900">Privacy & Data</h2>
                <p className="text-gray-500 mt-1">
                  Manage your data and privacy preferences. We take your privacy seriously.
                </p>

                {!user ? (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">Sign in to manage your data.</p>
                  </div>
                ) : (
                  <>
                    {/* Data Retention Info */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex gap-3">
                        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-700">Data Retention Policy</p>
                          <p className="text-blue-600 text-sm mt-1">
                            Verification data is automatically deleted 2 years after completion. 
                            Bank account connections are disconnected immediately after fetching data.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Export Data */}
                    <div className="mt-6 p-6 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Download className="w-5 h-5 text-emerald-600" />
                            Export Your Data
                          </h3>
                          <p className="text-gray-500 text-sm mt-1">
                            Download all your account data in JSON format. This includes your profile, 
                            verifications (without raw financial data), and activity logs.
                          </p>
                        </div>
                        <button
                          onClick={exportData}
                          disabled={exporting}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white font-medium rounded-lg transition-colors"
                        >
                          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                          Export
                        </button>
                      </div>
                    </div>

                    {/* Delete Data */}
                    <div className="mt-4 p-6 border border-red-200 bg-red-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-red-700 flex items-center gap-2">
                            <Trash2 className="w-5 h-5" />
                            Delete All Data
                          </h3>
                          <p className="text-red-600 text-sm mt-1">
                            Permanently delete your account and all associated data. 
                            This action cannot be undone.
                          </p>
                        </div>
                        {!showDeleteConfirm ? (
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowDeleteConfirm(false)}
                              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={deleteAllData}
                              disabled={deleting}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors"
                            >
                              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                              Confirm Delete
                            </button>
                          </div>
                        )}
                      </div>
                      {showDeleteConfirm && (
                        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                          <p className="text-red-800 text-sm font-medium flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Are you absolutely sure? This will permanently delete:
                          </p>
                          <ul className="text-red-700 text-sm mt-2 ml-6 list-disc">
                            <li>Your account and profile</li>
                            <li>All income verifications and reports</li>
                            <li>All stored financial data</li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Privacy Info */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <h3 className="font-semibold text-gray-900 mb-3">How We Protect Your Data</h3>
                      <ul className="space-y-2 text-gray-600 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">✓</span>
                          <span>All data is encrypted at rest and in transit</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">✓</span>
                          <span>Bank connections are read-only and disconnected immediately after use</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">✓</span>
                          <span>We never store bank login credentials</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">✓</span>
                          <span>Account numbers are masked (only last 4 digits stored)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">✓</span>
                          <span>All access is logged for security auditing</span>
                        </li>
                      </ul>
                      <p className="mt-4 text-sm text-gray-500">
                        Read our full{' '}
                        <a href="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</a>
                        {' '}and{' '}
                        <a href="/security" className="text-emerald-600 hover:underline">Security Documentation</a>.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

