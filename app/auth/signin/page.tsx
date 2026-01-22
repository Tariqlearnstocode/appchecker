'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeCompanyName } from '@/utils/sanitize';
import Link from 'next/link';
import { FileCheck } from 'lucide-react';

type AuthMode = 'signin' | 'signup' | 'reset';

export default function SignInPage() {
  const { supabase, user } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [verifyingMfa, setVerifyingMfa] = useState(false);
  const [pendingPassword, setPendingPassword] = useState<string>('');

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const sanitizedCompanyName = companyName ? sanitizeCompanyName(companyName) : null;
      const sanitizedFirstName = firstName.trim() || null;
      const sanitizedLastName = lastName.trim() || null;
      const sanitizedIndustry = industry.trim() || null;
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            company_name: sanitizedCompanyName,
            first_name: sanitizedFirstName,
            last_name: sanitizedLastName,
            industry: sanitizedIndustry
          }
        }
      });

      if (signUpError) throw signUpError;

      if (signUpData.user) {
        try {
          await fetch('/api/stripe/create-customer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: signUpData.user.id,
              email: signUpData.user.email || email,
            }),
          });
        } catch (stripeError) {
          console.error('Error creating Stripe customer:', stripeError);
        }
      }

      // Redirect to dashboard
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      setPendingPassword(password);
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setPendingPassword('');
        throw signInError;
      }

      if (data.session) {
        const { data: factorsData } = await supabase.auth.mfa.listFactors();
        const totpFactors = factorsData?.totp || [];
        
        if (totpFactors.length > 0) {
          await supabase.auth.signOut();
          
          const { data: reAuthData, error: reAuthError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (reAuthError || !reAuthData.session) {
            setPendingPassword('');
            throw reAuthError || new Error('Failed to re-authenticate for MFA');
          }
          
          const factor = totpFactors[0];
          const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
            factorId: factor.id,
          });
          
          if (challengeError) {
            await supabase.auth.signOut();
            setPendingPassword('');
            throw challengeError;
          }
          
          await supabase.auth.signOut();
          
          setMfaRequired(true);
          setMfaFactors(totpFactors);
          setMfaChallengeId(challengeData.id);
          setLoading(false);
          return;
        }
      }

      setPendingPassword('');
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      setPendingPassword('');
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVerifyingMfa(true);

    try {
      if (!mfaChallengeId || !mfaCode || mfaFactors.length === 0 || !pendingPassword) {
        throw new Error('Missing MFA information');
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: pendingPassword,
      });

      if (signInError || !signInData.session) {
        throw signInError || new Error('Failed to authenticate for MFA verification');
      }

      const factor = mfaFactors[0];
      const { data, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factor.id,
        challengeId: mfaChallengeId,
        code: mfaCode,
      });

      if (verifyError) {
        await supabase.auth.signOut();
        setMfaCode('');
        setVerifyingMfa(false);
        return;
      }

      setPendingPassword('');
      router.push('/');
    } catch (err: any) {
      if (err.message && !err.message.includes('verification') && !err.message.includes('code') && !err.message.includes('MFA')) {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      } else {
        setMfaCode('');
      }
      await supabase.auth.signOut();
      setVerifyingMfa(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (resetError) throw resetError;

      setResetEmailSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 justify-center">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-xl">IncomeChecker.com</span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {mfaRequired 
              ? 'Enter verification code' 
              : mode === 'signup' 
              ? 'Create your account' 
              : mode === 'signin' 
              ? 'Welcome back' 
              : 'Reset password'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {mfaRequired
              ? 'Enter the 6-digit code from your authenticator app'
              : mode === 'signup' 
              ? 'Sign up to create your verification request' 
              : mode === 'signin'
              ? 'Sign in to continue'
              : 'Enter your email to receive a password reset link'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form 
            onSubmit={
              mfaRequired 
                ? handleMfaVerify
                : mode === 'signup' 
                ? handleSignUp 
                : mode === 'signin' 
                ? handleSignIn 
                : handlePasswordReset
            } 
            className="space-y-6"
          >
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            {resetEmailSent && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-600">
                Password reset email sent! Check your inbox and click the link to reset your password.
              </div>
            )}

            {mfaRequired ? (
              <>
                <div>
                  <label htmlFor="mfa-code" className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    id="mfa-code"
                    type="text"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-center text-lg tracking-widest"
                    autoComplete="one-time-code"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter the 6-digit code from your authenticator app</p>
                </div>

                <button
                  type="submit"
                  disabled={verifyingMfa || mfaCode.length !== 6}
                  className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {verifyingMfa && <Loader2 className="w-4 h-4 animate-spin" />}
                  {verifyingMfa ? 'Verifying...' : 'Verify & Sign In'}
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setMfaRequired(false);
                    setMfaCode('');
                    setMfaChallengeId(null);
                    setMfaFactors([]);
                    setPendingPassword('');
                    setError('');
                  }}
                  className="w-full py-2 px-4 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel and sign out
                </button>
              </>
            ) : (
              <>
                {mode === 'signup' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 mb-2">
                          First Name (optional)
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
                          Last Name (optional)
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
                        Company Name (optional)
                      </label>
                      <input
                        id="company-name"
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="ABC Properties"
                      />
                    </div>
                    <div>
                      <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                        Industry (optional)
                      </label>
                      <select
                        id="industry"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                      >
                        <option value="">Select an industry</option>
                        <option value="Lending">Lending</option>
                        <option value="Financial Services">Financial Services</option>
                        <option value="Real Estate">Real Estate</option>
                        <option value="Property Management">Property Management</option>
                        <option value="HR & Employment">HR & Employment</option>
                        <option value="Insurance">Insurance</option>
                        <option value="Government">Government</option>
                        <option value="Non-Profit">Non-Profit</option>
                        <option value="Background Screening">Background Screening</option>
                        <option value="Credit Union">Credit Union</option>
                        <option value="Mortgage Broker">Mortgage Broker</option>
                        <option value="Legal Services">Legal Services</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </>
                )}
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
                
                {mode !== 'reset' && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder={mode === 'signup' ? 'Create a password' : 'Your password'}
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      required
                      minLength={6}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || resetEmailSent}
                  className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {mode === 'signup' ? 'Create Account' : mode === 'signin' ? 'Sign In' : 'Send Reset Link'}
                </button>
              </>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {mode === 'signup' ? (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => { setMode('signin'); setError(''); }}
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Sign in
                  </button>
                </>
              ) : mode === 'signin' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => { setMode('signup'); setError(''); }}
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Create one
                  </button>
                  {' · '}
                  <button
                    onClick={() => { setMode('reset'); setError(''); }}
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Forgot password?
                  </button>
                </>
              ) : (
                <>
                  Remember your password?{' '}
                  <button
                    onClick={() => { setMode('signin'); setError(''); setResetEmailSent(false); }}
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
