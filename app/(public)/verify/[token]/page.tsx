'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTellerConnect } from 'teller-connect-react';
import { useParams } from 'next/navigation';
import { CheckCircle, Loader2, AlertCircle, Lock, Building, Mail, MapPin, ShieldCheck } from 'lucide-react';

type VerificationStatus = 'pending' | 'in_progress' | 'completed' | 'expired' | 'failed';

interface Verification {
  id: string;
  individual_name: string;
  individual_email: string;
  status: VerificationStatus;
  expires_at: string;
  requested_by_name: string | null;
  requested_by_email: string | null;
  purpose: string | null;
}

export default function ApplicantVerificationPage() {
  const params = useParams();
  const token = params.token as string;

  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tellerConfig, setTellerConfig] = useState<{ applicationId: string; environment: string } | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    fetchVerification();
    fetchTellerConfig();
  }, [token]);

  async function fetchTellerConfig() {
    try {
      const response = await fetch('/api/teller/init-connect');
      if (!response.ok) {
        setConfigError('Failed to load Teller configuration');
        return;
      }
      const data = await response.json();
      setTellerConfig({
        applicationId: data.applicationId,
        environment: data.environment,
      });
    } catch (err) {
      setConfigError('Failed to load Teller configuration');
    }
  }

  async function fetchVerification() {
    try {
      const response = await fetch(`/api/verify/${token}`);
      const result = await response.json();

      if (!response.ok || result.error) {
        setError('Verification request not found');
        setLoading(false);
        return;
      }

      const data = result.verification;

      // Check if expired
      const expiresAt = new Date(data.expires_at);
      if (expiresAt < new Date()) {
        setError('This verification link has expired');
        setLoading(false);
        return;
      }

      if (data.status === 'completed') {
        setSuccess(true);
        setLoading(false);
        return;
      }

      setVerification(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load verification');
      setLoading(false);
    }
  }

  // Handle Teller Connect success
  const onTellerSuccess = useCallback(async (enrollment: { accessToken: string }) => {
    setConnecting(true);
    try {
      const response = await fetch('/api/teller/fetch-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: enrollment.accessToken,
          verification_token: token,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to complete verification');
      }
    } catch (err) {
      setError('Failed to complete verification');
    }
    setConnecting(false);
  }, [token]);

  // Teller Connect hook
  const { open, ready } = useTellerConnect({
    applicationId: tellerConfig?.applicationId || '',
    environment: (tellerConfig?.environment || 'sandbox') as 'sandbox' | 'development' | 'production',
    onSuccess: onTellerSuccess,
    onExit: () => {
      // User closed without completing
    },
    selectAccount: 'multiple', // Allow selecting multiple accounts
    products: ['transactions', 'balance'], // Request transactions and balance
  });

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading verification...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Verification Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Verification Complete!</h1>
          <p className="text-gray-600 mb-6">
            Your income verification has been submitted successfully. 
            {verification?.requested_by_name && ` ${verification.requested_by_name} can now`} view your income verification report.
          </p>
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Lock className="w-4 h-4" />
              Your bank credentials were never stored
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main verification page
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Income Checker</h1>
          <p className="text-gray-500">Secure bank connection powered by Teller</p>
        </div>

        {/* Requester Card - Who's asking */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Verification requested by</p>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900">
                {verification?.requested_by_name || 'Requesting Party'}
              </h2>
              {verification?.requested_by_email && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <Mail className="w-4 h-4" />
                  {verification.requested_by_email}
                </div>
              )}
              {verification?.purpose && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 mt-1">
                  <MapPin className="w-4 h-4" />
                  {verification.purpose}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Individual Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Income verification for</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-lg font-medium text-gray-600">
                {verification?.individual_name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{verification?.individual_name}</p>
              <p className="text-sm text-gray-500">{verification?.individual_email}</p>
            </div>
          </div>
        </div>

        {/* What will be shared */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">What will be shared:</h3>
          <ul className="space-y-3">
            {[
              'Account balances (checking, savings)',
              'Income deposits & paychecks',
              'Transaction history (last 3 months)',
              'Estimated monthly income',
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-700">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Connect Button */}
        <button
          onClick={() => open()}
          disabled={!ready || connecting}
          className="w-full py-4 px-6 bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-3"
        >
          {connecting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              {/* Teller Logo */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l6.9 3.45L12 11.08 5.1 7.63 12 4.18zM4 8.9l7 3.5v7.7l-7-3.5V8.9zm9 11.2v-7.7l7-3.5v7.7l-7 3.5z"/>
              </svg>
              Connect Your Bank
            </>
          )}
        </button>

        {/* Trust indicators */}
        <div className="mt-6 space-y-4">
          {/* Security info */}
          <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-900">Bank-level security</p>
              <p className="text-sm text-emerald-700">
                Teller uses 256-bit encryption. Your bank login is never stored or shared.
              </p>
            </div>
          </div>

          {/* Trust badge */}
          <div className="flex items-center justify-center gap-3 py-4">
            <div className="flex items-center gap-2 text-gray-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="opacity-60">
                <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l6.9 3.45L12 11.08 5.1 7.63 12 4.18zM4 8.9l7 3.5v7.7l-7-3.5V8.9zm9 11.2v-7.7l7-3.5v7.7l-7 3.5z"/>
              </svg>
              <span className="text-xs font-medium">Powered by Teller</span>
            </div>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-gray-400">Direct bank connections</span>
          </div>

          {/* Fine print */}
          <p className="text-xs text-center text-gray-400 leading-relaxed">
            By connecting your account, you authorize read-only access to your financial data 
            for income verification purposes. You can revoke access at any time through your bank.
          </p>
        </div>
      </div>
    </div>
  );
}
