'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { createClient } from '@/utils/supabase/client';
import { useParams } from 'next/navigation';
import { CheckCircle, Loader2, AlertCircle, Lock, Building, Mail, MapPin, ShieldCheck } from 'lucide-react';

type VerificationStatus = 'pending' | 'in_progress' | 'completed' | 'expired' | 'failed';

interface Verification {
  id: string;
  applicant_name: string;
  applicant_email: string;
  status: VerificationStatus;
  expires_at: string;
  landlord_name: string | null;
  landlord_email: string | null;
  property_unit: string | null;
}

export default function ApplicantVerificationPage() {
  const params = useParams();
  const token = params.token as string;

  const [verification, setVerification] = useState<Verification | null>(null);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchVerification();
  }, [token]);

  async function fetchVerification() {
    const { data, error } = await supabase
      .from('income_verifications')
      .select('id, applicant_name, applicant_email, status, expires_at, landlord_name, landlord_email, property_unit')
      .eq('verification_token', token)
      .single();

    if (error || !data) {
      setError('Verification request not found');
      setLoading(false);
      return;
    }

    if (new Date(data.expires_at) < new Date()) {
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
    await createLinkToken(data.applicant_name);
    setLoading(false);
  }

  async function createLinkToken(applicantName: string) {
    try {
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verification_token: token,
          applicant_name: applicantName,
        }),
      });

      const data = await response.json();
      if (data.link_token) {
        setLinkToken(data.link_token);
      } else {
        setError('Failed to initialize bank connection');
      }
    } catch (err) {
      setError('Failed to initialize bank connection');
    }
  }

  const onPlaidSuccess = useCallback(async (publicToken: string) => {
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
        setError('Failed to complete verification');
      }
    } catch (err) {
      setError('Failed to complete verification');
    }
    setConnecting(false);
  }, [token]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
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
            {verification?.landlord_name && ` ${verification.landlord_name} can now`} view your financial report.
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
        
        {/* Header with Plaid branding */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Income Verification</h1>
          <p className="text-gray-500">Secure verification powered by Plaid</p>
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
                {verification?.landlord_name || 'Property Manager'}
              </h2>
              {verification?.landlord_email && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <Mail className="w-4 h-4" />
                  {verification.landlord_email}
                </div>
              )}
              {verification?.property_unit && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 mt-1">
                  <MapPin className="w-4 h-4" />
                  {verification.property_unit}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Applicant Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Verifying income for</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-lg font-medium text-gray-600">
                {verification?.applicant_name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{verification?.applicant_name}</p>
              <p className="text-sm text-gray-500">{verification?.applicant_email}</p>
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
              Connecting...
            </>
          ) : (
            <>
              {/* Plaid Logo SVG */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.944 0L6.406 2.594v5.18l6.538-2.593V0zm0 7.363L6.406 9.956v5.18l6.538-2.593V7.363zm0 7.363L6.406 17.32v5.18l6.538-2.594v-5.18zM6.406 2.594L0 5.188v5.18l6.406-2.594v-5.18zm0 7.362L0 12.55v5.18l6.406-2.593V9.956zm0 7.363L0 19.914v5.18l6.406-2.594v-5.18zM12.944 2.594v5.18l6.406-2.594V0l-6.406 2.594zm0 7.362v5.18l6.406-2.593V7.363l-6.406 2.593zm0 7.363v5.18l6.406-2.594v-5.18l-6.406 2.594zM19.35 5.188v5.18L24 7.774V2.594l-4.65 2.594zm0 7.362v5.18l4.65-2.593v-5.18l-4.65 2.593zm0 7.363v5.18l4.65-2.594v-5.18l-4.65 2.594z"/>
              </svg>
              Connect with Plaid
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
                Plaid uses 256-bit encryption. Your bank login is never stored or shared.
              </p>
            </div>
          </div>

          {/* Plaid trust badge */}
          <div className="flex items-center justify-center gap-3 py-4">
            <div className="flex items-center gap-2 text-gray-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="opacity-60">
                <path d="M12.944 0L6.406 2.594v5.18l6.538-2.593V0zm0 7.363L6.406 9.956v5.18l6.538-2.593V7.363zm0 7.363L6.406 17.32v5.18l6.538-2.594v-5.18zM6.406 2.594L0 5.188v5.18l6.406-2.594v-5.18zm0 7.362L0 12.55v5.18l6.406-2.593V9.956zm0 7.363L0 19.914v5.18l6.406-2.594v-5.18zM12.944 2.594v5.18l6.406-2.594V0l-6.406 2.594zm0 7.362v5.18l6.406-2.593V7.363l-6.406 2.593zm0 7.363v5.18l6.406-2.594v-5.18l-6.406 2.594zM19.35 5.188v5.18L24 7.774V2.594l-4.65 2.594zm0 7.362v5.18l4.65-2.593v-5.18l-4.65 2.593zm0 7.363v5.18l4.65-2.594v-5.18l-4.65 2.594z"/>
              </svg>
              <span className="text-xs font-medium">Powered by Plaid</span>
            </div>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-gray-400">Used by Venmo, Coinbase & more</span>
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
