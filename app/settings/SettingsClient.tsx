'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { Settings, User, CreditCard, Shield, Save, Loader2, Download, Trash2, AlertTriangle, ExternalLink, QrCode, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { sanitizeCompanyName } from '@/utils/sanitize';

interface SettingsClientProps {
  user: SupabaseUser;
  profile: { 
    company_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    industry?: string | null;
  } | null;
  activeTab: string;
}

type Tab = 'profile' | 'subscription' | 'account';

export default function SettingsClient({ user, profile, activeTab }: SettingsClientProps) {
  const { supabase } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [companyName, setCompanyName] = useState(profile?.company_name || '');
  const [industry, setIndustry] = useState(profile?.industry || '');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [error, setError] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  
  // MFA state
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);
  const [loadingMfa, setLoadingMfa] = useState(false);
  const [enrollingMfa, setEnrollingMfa] = useState(false);
  const [mfaEnrollmentData, setMfaEnrollmentData] = useState<{ id: string; qr_code: string; secret: string } | null>(null);
  const [mfaVerificationCode, setMfaVerificationCode] = useState('');
  const [verifyingMfa, setVerifyingMfa] = useState(false);

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'subscription', label: 'Manage Subscription', icon: CreditCard },
    { id: 'account', label: 'Account Settings', icon: Shield },
  ];

  const currentTab = (activeTab as Tab) || 'profile';


  // Load subscription status
  useEffect(() => {
    if (currentTab === 'subscription') {
      loadSubscriptionStatus();
    }
  }, [currentTab]);

  // Load MFA factors
  useEffect(() => {
    if (currentTab === 'account') {
      loadMfaFactors();
    }
  }, [currentTab]);

  async function loadSubscriptionStatus() {
    setLoadingSubscription(true);
    try {
      const response = await fetch('/api/stripe/subscription-status');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
      }
    } catch (error) {
      console.error('Error loading subscription status:', error);
    } finally {
      setLoadingSubscription(false);
    }
  }

  async function loadMfaFactors() {
    setLoadingMfa(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setMfaFactors(data?.totp || []);
    } catch (error: any) {
      console.error('Error loading MFA factors:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load MFA factors',
        variant: 'destructive',
      });
    } finally {
      setLoadingMfa(false);
    }
  }

  async function startMfaEnrollment() {
    setEnrollingMfa(true);
    setError('');
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });
      
      if (error) throw error;
      
      if (!data || !data.totp) {
        throw new Error('Invalid enrollment data received');
      }
      
      setMfaEnrollmentData({
        id: data.id,
        qr_code: data.totp.qr_code,
        secret: data.totp.secret,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start MFA enrollment',
        variant: 'destructive',
      });
    } finally {
      setEnrollingMfa(false);
    }
  }

  async function verifyMfaEnrollment() {
    if (!mfaEnrollmentData || !mfaVerificationCode) {
      toast({
        title: 'Error',
        description: 'Please enter a verification code',
        variant: 'destructive',
      });
      return;
    }

    setVerifyingMfa(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: mfaEnrollmentData.id,
      });
      
      if (challengeError) throw challengeError;
      
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaEnrollmentData.id,
        challengeId: challengeData.id,
        code: mfaVerificationCode,
      });
      
      if (verifyError) throw verifyError;
      
      toast({
        title: 'MFA enabled',
        description: 'Multi-factor authentication has been successfully enabled.',
      });
      
      // Reset enrollment state
      setMfaEnrollmentData(null);
      setMfaVerificationCode('');
      
      // Reload factors
      await loadMfaFactors();
    } catch (error: any) {
      toast({
        title: 'Verification failed',
        description: error.message || 'Invalid verification code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setVerifyingMfa(false);
    }
  }

  async function unenrollMfa(factorId: string) {
    if (!confirm('Are you sure you want to disable multi-factor authentication? This will make your account less secure.')) {
      return;
    }

    setLoadingMfa(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      
      toast({
        title: 'MFA disabled',
        description: 'Multi-factor authentication has been disabled.',
      });
      
      // Reload factors
      await loadMfaFactors();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to disable MFA',
        variant: 'destructive',
      });
    } finally {
      setLoadingMfa(false);
    }
  }

  function cancelMfaEnrollment() {
    setMfaEnrollmentData(null);
    setMfaVerificationCode('');
  }

  async function openCustomerPortal() {
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Error',
          description: data.error || 'Failed to open customer portal',
          variant: 'destructive',
        });
        return;
      }

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to open customer portal',
        variant: 'destructive',
      });
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Sanitize inputs before saving
      const sanitizedFirstName = firstName.trim() || null;
      const sanitizedLastName = lastName.trim() || null;
      const sanitizedCompanyName = companyName ? sanitizeCompanyName(companyName) : null;
      const sanitizedIndustry = industry.trim() || null;
      
      const { error } = await supabase
        .from('users')
        .update({ 
          first_name: sanitizedFirstName,
          last_name: sanitizedLastName,
          company_name: sanitizedCompanyName,
          industry: sanitizedIndustry
        })
        .eq('id', user.id);

      if (error) throw error;

      // Also update auth metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { 
          first_name: sanitizedFirstName,
          last_name: sanitizedLastName,
          company_name: sanitizedCompanyName,
          industry: sanitizedIndustry
        }
      });

      if (metadataError) throw metadataError;

      toast({
        title: 'Settings saved',
        description: 'Your settings have been updated successfully.',
      });

      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/gdpr/export');
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-export-${user.id}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export started',
        description: 'Your data export is downloading.',
      });
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error.message || 'Failed to export your data',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE_ALL_MY_DATA') {
      toast({
        title: 'Confirmation required',
        description: 'Please type "DELETE_ALL_MY_DATA" to confirm',
        variant: 'destructive',
      });
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch('/api/gdpr/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE_ALL_MY_DATA' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Deletion failed');
      }

      toast({
        title: 'Account deleted',
        description: 'Your account and all data have been deleted.',
      });

      // Sign out and redirect
      await supabase.auth.signOut();
      router.push('/');
    } catch (error: any) {
      toast({
        title: 'Deletion failed',
        description: error.message || 'Failed to delete your account',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'profile':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile</h2>
            <p className="text-gray-600 mb-6">Update your profile information</p>

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    id="first-name"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    id="last-name"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  id="company-name"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Your company name"
                />
                <p className="text-xs text-gray-500 mt-1">This will be used as the default "Requested By" name for new verifications</p>
              </div>

              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <select
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                >
                  <option value="">Select an industry</option>
                  <option value="Financial Services">Financial Services</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="HR & Employment">HR & Employment</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Legal Services">Legal Services</option>
                  <option value="Technology">Technology</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-medium rounded-lg transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        );

      case 'subscription':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage Subscription</h2>
            <p className="text-gray-600 mb-6">Manage your subscription and billing</p>

            {loadingSubscription ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : subscriptionStatus?.hasSubscription ? (
              <div className="space-y-6">
                {/* Current Plan */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {subscriptionStatus.plan === 'starter' ? 'Starter Plan' : 'Pro Plan'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {subscriptionStatus.plan === 'starter' ? '$59/month' : '$129/month'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      subscriptionStatus.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {subscriptionStatus.status === 'active' ? 'Active' : subscriptionStatus.status}
                    </span>
                  </div>

                  {subscriptionStatus.usageInfo && subscriptionStatus.limit && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-2">Remaining this period</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-900">
                          {Math.max(0, subscriptionStatus.limit - subscriptionStatus.usageInfo.totalUsage)}
                        </span>
                        <span className="text-sm text-gray-500">
                          / {subscriptionStatus.limit} verifications remaining
                        </span>
                      </div>
                      {subscriptionStatus.usageInfo.totalUsage >= subscriptionStatus.limit && (
                        <p className="text-xs text-amber-600 mt-2">
                          Limit reached. Upgrade to continue creating verifications.
                        </p>
                      )}
                    </div>
                  )}

                  {subscriptionStatus.currentPeriodEnd && (
                    <p className="text-xs text-gray-500 mt-4">
                      Next billing date: {new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Manage Subscription */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Subscription Management</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Update your plan, payment method, or view billing history
                  </p>
                  <button
                    onClick={openCustomerPortal}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Customer Portal
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <p className="text-sm text-gray-600 mb-4">
                  You don't have an active subscription. Subscribe to save on verifications.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                >
                  View Plans
                </Link>
              </div>
            )}
          </div>
        );

      case 'account':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Settings</h2>
            <p className="text-gray-600 mb-6">Manage your account and data</p>

            <div className="space-y-6">
              {/* MFA Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Multi-Factor Authentication</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add an extra layer of security to your account by requiring a code from your authenticator app when signing in.
                </p>

                {loadingMfa ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : mfaEnrollmentData ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900 mb-3">
                        Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
                      </p>
                      <div className="flex justify-center mb-3">
                        <img 
                          src={mfaEnrollmentData.qr_code} 
                          alt="MFA QR Code" 
                          className="border border-gray-300 rounded-lg"
                        />
                      </div>
                      <p className="text-xs text-blue-700 mb-2">
                        Or enter this code manually: <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono text-xs">{mfaEnrollmentData.secret}</code>
                      </p>
                      <p className="text-xs text-blue-700">
                        After scanning, enter the 6-digit code from your app to complete setup.
                      </p>
                    </div>
                    <div>
                      <label htmlFor="mfa-code" className="block text-sm font-medium text-gray-700 mb-2">
                        Verification Code
                      </label>
                      <input
                        id="mfa-code"
                        type="text"
                        value={mfaVerificationCode}
                        onChange={(e) => setMfaVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-center text-lg tracking-widest"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={verifyMfaEnrollment}
                        disabled={verifyingMfa || mfaVerificationCode.length !== 6}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-medium rounded-lg transition-colors"
                      >
                        {verifyingMfa ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Verify & Enable
                          </>
                        )}
                      </button>
                      <button
                        onClick={cancelMfaEnrollment}
                        disabled={verifyingMfa}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : mfaFactors.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">MFA is enabled</span>
                    </div>
                    <div className="space-y-2">
                      {mfaFactors.map((factor) => (
                        <div key={factor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{factor.friendly_name || 'Authenticator App'}</p>
                            <p className="text-xs text-gray-500">Enrolled {new Date(factor.created_at).toLocaleDateString()}</p>
                          </div>
                          <button
                            onClick={() => unenrollMfa(factor.id)}
                            disabled={loadingMfa}
                            className="px-3 py-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-lg transition-colors disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={startMfaEnrollment}
                    disabled={enrollingMfa}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-medium rounded-lg transition-colors"
                  >
                    {enrollingMfa ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4" />
                        Enable MFA
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Account Info */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">User ID</p>
                    <p className="text-xs text-gray-500 mt-1 font-mono">{user.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Account Created</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* GDPR Export */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Your Data</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Download a copy of all your data in JSON format. This includes your profile, verifications, and audit logs.
                </p>
                <button
                  onClick={handleExportData}
                  disabled={exporting}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Export Data
                    </>
                  )}
                </button>
              </div>

              {/* GDPR Delete */}
              <div className="bg-red-50 rounded-lg border border-red-200 p-6">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-900 mb-2">Delete Account</h3>
                    <p className="text-sm text-red-700 mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="delete-confirm" className="block text-sm font-medium text-red-900 mb-2">
                      Type <code className="bg-red-100 px-1.5 py-0.5 rounded text-red-900 font-mono text-xs">DELETE_ALL_MY_DATA</code> to confirm:
                    </label>
                    <input
                      id="delete-confirm"
                      type="text"
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      className="w-full px-3 py-2.5 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="DELETE_ALL_MY_DATA"
                    />
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting || deleteConfirm !== 'DELETE_ALL_MY_DATA'}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete Account
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="w-8 h-8" />
            Settings
          </h1>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg border border-gray-200 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <Link
                    key={tab.id}
                    href={`/settings?tab=${tab.id}`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
