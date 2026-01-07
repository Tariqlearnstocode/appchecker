'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { createClient } from '@/utils/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { Shield, CheckCircle, Loader2, AlertCircle, Building2, Lock } from 'lucide-react';

type VerificationStatus = 'pending' | 'in_progress' | 'completed' | 'expired' | 'failed';

interface Verification {
  id: string;
  applicant_name: string;
  applicant_email: string;
  status: VerificationStatus;
  expires_at: string;
}

export default function ApplicantVerificationPage() {
  const params = useParams();
  const router = useRouter();
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
      .select('id, applicant_name, applicant_email, status, expires_at')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading verification...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Verification Error</h1>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-emerald-500/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Verification Complete!</h1>
          <p className="text-slate-400 mb-6">
            Your income verification has been submitted successfully. The landlord will be able to view your financial report.
          </p>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-sm text-slate-500">
              Your bank credentials are never stored. Only read-only financial data is shared.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Income Verification</h1>
          <p className="text-slate-400">
            Securely verify your income for your rental application
          </p>
        </div>

        {/* Applicant Info Card */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
              <span className="text-xl font-semibold text-white">
                {verification?.applicant_name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{verification?.applicant_name}</h2>
              <p className="text-sm text-slate-500">{verification?.applicant_email}</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm">
            A landlord has requested income verification for your rental application. 
            Connect your bank account securely via Plaid to generate your financial report.
          </p>
        </div>

        {/* What Will Be Shared */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">What will be shared:</h3>
          <ul className="space-y-3">
            {[
              'Account balances (checking, savings)',
              'Income transactions (deposits, paychecks)',
              'Transaction history (last 3 months)',
              'Estimated monthly income',
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-slate-300">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Connect Button */}
        <button
          onClick={() => open()}
          disabled={!ready || connecting}
          className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/20 disabled:shadow-none flex items-center justify-center gap-3"
        >
          {connecting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Building2 className="w-5 h-5" />
              Connect Your Bank Account
            </>
          )}
        </button>

        {/* Security Info */}
        <div className="mt-8 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-slate-400">
                <strong className="text-slate-300">Bank-level security:</strong> Plaid uses 256-bit encryption and never stores your login credentials. We only receive read-only access to your financial data.
              </p>
            </div>
          </div>
        </div>

        {/* Plaid Badge */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-600">
            Secured by Plaid • Used by thousands of financial apps
          </p>
        </div>
      </div>
    </div>
  );
}

