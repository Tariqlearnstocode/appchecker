'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileCheck, User, FileText, CreditCard, Puzzle, ExternalLink, Info, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { createClient } from '@/utils/supabase/client';

type SettingsTab = 'account' | 'defaults' | 'subscription' | 'integrations';

interface VerificationDefaults {
  companyName: string;
  email: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [defaults, setDefaults] = useState<VerificationDefaults>({ companyName: '', email: '' });
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  // Check auth and load defaults
  useEffect(() => {
    async function init() {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoadingUser(false);

      if (user) {
        // Load from database
        const { data } = await supabase
          .from('user_preferences')
          .select('company_name, email')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setDefaults({ companyName: data.company_name || '', email: data.email || '' });
        }
      } else {
        // Load from localStorage
        const saved = localStorage.getItem('verification_defaults');
        if (saved) {
          setDefaults(JSON.parse(saved));
        }
      }
    }
    init();
  }, []);

  async function saveDefaults() {
    setSaving(true);
    
    if (user) {
      // Save to database
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          company_name: defaults.companyName,
          email: defaults.email,
        }, { onConflict: 'user_id' });
      
      if (error) {
        toast({ title: 'Error', description: 'Failed to save preferences', variant: 'destructive' });
      } else {
        toast({ title: 'Saved!', description: 'Your defaults have been saved to your account.' });
      }
    } else {
      // Save to localStorage
      localStorage.setItem('verification_defaults', JSON.stringify(defaults));
      toast({ title: 'Saved!', description: 'Your defaults have been saved locally.' });
    }
    
    setSaving(false);
  }

  // Migrate localStorage verifications to user account
  async function migrateLocalData() {
    if (!user) return;
    
    setSaving(true);
    const sessionId = localStorage.getItem('landlord_session_id');
    
    if (!sessionId) {
      toast({ title: 'No data to migrate', description: 'No local verifications found.' });
      setSaving(false);
      return;
    }

    // Update all verifications with this session_id to the user's account
    const { data, error } = await supabase
      .from('income_verifications')
      .update({ user_id: user.id })
      .eq('session_id', sessionId)
      .is('user_id', null)
      .select();

    if (error) {
      toast({ title: 'Error', description: 'Failed to migrate verifications', variant: 'destructive' });
    } else {
      const count = data?.length || 0;
      toast({ 
        title: 'Migration complete!', 
        description: `${count} verification${count !== 1 ? 's' : ''} linked to your account.` 
      });
      // Clear the session ID since data is now in the account
      localStorage.removeItem('landlord_session_id');
    }
    
    setSaving(false);
  }

  const tabs = [
    { id: 'account' as const, label: 'Account Details', icon: User },
    { id: 'defaults' as const, label: 'Verification Defaults', icon: FileText },
    { id: 'subscription' as const, label: 'Manage Subscription', icon: CreditCard, external: true },
    { id: 'integrations' as const, label: 'Integrations', icon: Puzzle },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900">Income Verifier</span>
            </Link>
          </div>
        </div>
      </header>

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

                    {/* Migration option */}
                    {typeof window !== 'undefined' && localStorage.getItem('landlord_session_id') && (
                      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex gap-3">
                          <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-amber-700">Local data detected</p>
                            <p className="text-amber-600 text-sm mt-1">
                              You have verifications stored locally from before you signed in. 
                              Link them to your account to access them from any device.
                            </p>
                            <button
                              onClick={migrateLocalData}
                              disabled={saving}
                              className="mt-3 flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                              Link Local Verifications
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
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

                <div className="mt-6">
                  <Link
                    href="/signin"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                  >
                    Log in / Sign up
                  </Link>
                </div>

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
                <div className="text-center max-w-xl mx-auto">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Create, Manage & Send Unlimited Verifications
                  </h2>
                  <p className="text-gray-500 mt-2">
                    Unlock more features and verify with ease by upgrading your plan.
                  </p>

                  {/* Pricing Cards */}
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="border-2 border-emerald-500 rounded-xl p-6 text-left relative">
                      <span className="absolute top-3 right-3 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                        Save 56%
                      </span>
                      <p className="font-medium text-gray-900">Annual</p>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-gray-900">$4</span>
                        <span className="text-gray-500"> / month</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Unlimited verifications, billed yearly.</p>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-6 text-left">
                      <p className="font-medium text-gray-900">Monthly</p>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-gray-900">$9</span>
                        <span className="text-gray-500"> / month</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Unlimited verifications, billed monthly.</p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mt-8 text-left">
                    <p className="font-medium text-gray-900 mb-3">PRO Features Include:</p>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-500">✓</span> Email verification links directly to applicants
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-500">✓</span> Automated reminders for pending verifications
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-500">✓</span> PDF report downloads
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-500">✓</span> Priority support
                      </li>
                    </ul>
                  </div>

                  <button className="mt-8 w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors">
                    Coming Soon
                  </button>
                </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}

