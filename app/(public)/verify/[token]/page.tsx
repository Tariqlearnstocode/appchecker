'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { CheckCircle, Loader2, AlertCircle, ArrowRight, Shield } from 'lucide-react';

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
  const searchParams = useSearchParams();
  const token = params.token as string;

  // Preview mode for testing states: ?preview=success or ?preview=error
  const previewMode = searchParams.get('preview');

  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);

  useEffect(() => {
    fetchVerification();
  }, [token]);

  useEffect(() => {
    if (verification && !success && !error) {
      fetchPlaidLinkToken();
    }
  }, [verification, success, error, token]);

  async function fetchPlaidLinkToken() {
    if (!verification) return;

    try {
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verification_token: token,
          applicant_name: verification.individual_name,
        }),
      });
      if (!response.ok) {
        // Plaid configuration failed - button will remain disabled
        return;
      }
      const data = await response.json();
      setLinkToken(data.link_token);
    } catch (err) {
      // Plaid configuration failed - button will remain disabled
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

  // Handle Plaid Link success
  const onPlaidSuccess = useCallback(async (publicToken: string, _metadata: unknown) => {
    setConnecting(true);
    try {
      const response = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_token: publicToken,
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

  // Plaid Link hook
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: () => {
      // User closed without completing
    },
  });

  // Mock data for preview mode
  const previewVerification: Verification = {
    id: 'preview',
    individual_name: 'John Smith',
    individual_email: 'john.smith@email.com',
    status: 'completed',
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    requested_by_name: 'Sunrise Properties',
    requested_by_email: 'leasing@sunriseproperties.com',
    purpose: 'Rental Application - Unit 4B',
  };

  // Loading state
  if (loading && !previewMode) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 animate-pulse" />
          </div>
          <p className="text-neutral-500 text-sm">Loading verification...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && previewMode !== 'error') {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
        <div className="max-w-sm w-full">
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-8 text-center shadow-sm">
            <div className="w-14 h-14 mx-auto mb-5 bg-red-50 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h1 className="text-lg font-semibold text-neutral-900 mb-2">Unable to Load</h1>
            <p className="text-neutral-500 text-sm leading-relaxed">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Error preview
  if (previewMode === 'error') {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <div className="h-1 bg-gradient-to-r from-red-400 via-red-500 to-orange-500" />
        <div className="max-w-md mx-auto px-5 py-10">
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <Image src="/logo-1024.svg" alt="IncomeChecker" width={36} height={36} className="rounded-lg" />
            <span className="text-xl font-semibold text-neutral-900">IncomeChecker.com</span>
          </div>
          <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-5 bg-red-50 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-xl font-semibold text-neutral-900 mb-2">Link Expired</h1>
              <p className="text-neutral-500 text-sm leading-relaxed mb-6">
                This verification link is no longer valid.
                <span className="block mt-2 text-neutral-600">
                  Please contact the requester for a new link.
                </span>
              </p>
            </div>
          </div>
          <p className="mt-6 text-xs text-center text-neutral-400">
            Questions? Visit <a href="/faq" className="text-emerald-600 hover:underline">our FAQ</a>
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (success || previewMode === 'success') {
    const displayVerification = verification || previewVerification;
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <div className="h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />
        <div className="max-w-md mx-auto px-5 py-10">
          {/* Logo + brand name */}
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <Image src="/logo-1024.svg" alt="IncomeChecker" width={36} height={36} className="rounded-lg" />
            <span className="text-xl font-semibold text-neutral-900">IncomeChecker.com</span>
          </div>

          {/* Success card */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden">
            {/* Success icon and message */}
            <div className="p-8 text-center border-b border-neutral-100">
              <div className="w-16 h-16 mx-auto mb-5 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h1 className="text-xl font-semibold text-neutral-900 mb-2">Verification Complete</h1>
              <p className="text-neutral-500 text-sm leading-relaxed">
                Your income has been securely verified.
              </p>
            </div>

            {/* What happens next */}
            <div className="px-6 py-5 bg-neutral-50/50">
              <p className="text-sm text-neutral-600">
                <span className="font-medium text-neutral-900">{displayVerification?.requested_by_name || 'The requester'}</span>
                {' '}can now review your income verification report.
              </p>
            </div>

            {/* Security reassurance */}
            <div className="px-6 py-4 border-t border-neutral-100">
              <div className="flex items-center gap-3 text-sm text-neutral-500">
                <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Your bank login was never stored or shared</span>
              </div>
            </div>
          </div>

          {/* Close window message */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-500">
              You can close this window.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main verification page
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Subtle gradient accent at top */}
      <div className="h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />

      <div className="max-w-md mx-auto px-5 py-10">
        {/* Logo + brand name */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <Image
            src="/logo-1024.svg"
            alt="IncomeChecker"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="text-xl font-semibold text-neutral-900">IncomeChecker.com</span>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden">

          {/* Requester section - the trust anchor */}
          <div className="p-6 border-b border-neutral-100">
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium mb-1">
              Verification request from
            </p>
            <h1 className="text-lg font-semibold text-neutral-900">
              {verification?.requested_by_name || 'Requesting Party'}
            </h1>
            {verification?.purpose && (
              <p className="text-sm text-neutral-500 mt-0.5">{verification.purpose}</p>
            )}
          </div>

          {/* Your info section */}
          <div className="px-6 py-5 bg-neutral-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {verification?.individual_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-neutral-900 text-sm">{verification?.individual_name}</p>
                  <p className="text-xs text-neutral-500">{verification?.individual_email}</p>
                </div>
              </div>
              <span className="text-xs text-neutral-400 bg-white px-2.5 py-1 rounded-full border border-neutral-200">
                You
              </span>
            </div>
          </div>

          {/* What's shared - compact */}
          <div className="px-6 py-5 border-t border-neutral-100">
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium mb-3">
              Data to be shared
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Account balances',
                'Deposit history',
                'Transactions (12 mo)',
                'Monthly income',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-neutral-600">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA section */}
          <div className="p-6 bg-gradient-to-b from-white to-neutral-50/80">
            <button
              onClick={() => open()}
              disabled={!ready || connecting || !linkToken}
              className="w-full py-5 px-6 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-3 group shadow-sm hover:shadow-md"
            >
              {connecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>Connect Your Bank</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Plaid trust badge - prominent */}
        <div className="mt-6 flex items-center justify-center gap-3 py-4 px-5 bg-white rounded-xl border border-neutral-200/80">
          <Image
            src="/plaid-logo.png"
            alt="Plaid"
            width={80}
            height={26}
          />
          <div className="text-left">
            <p className="text-sm font-medium text-neutral-900">Secured by Plaid</p>
            <p className="text-xs text-neutral-500">Bank-level 256-bit encryption</p>
          </div>
          <Shield className="w-5 h-5 text-emerald-500 ml-auto" />
        </div>

        {/* Fine print */}
        <p className="mt-5 text-xs text-center text-neutral-400 leading-relaxed px-4">
          Read-only access for income verification only.
          <br />
          <span className="text-neutral-500">Revoke anytime through your bank.</span>
        </p>
      </div>
    </div>
  );
}
