'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeCompanyName } from '@/utils/sanitize';
import { getRef, clearRef } from '@/utils/captureRef';
import Link from 'next/link';
import { FileCheck } from 'lucide-react';

type AuthMode = 'signin' | 'signup' | 'reset';

export default function SignInPage() {
  const { supabase, user } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { ref: getRef() }
        }
      });

      if (signUpError) throw signUpError;

      clearRef();

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

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      });

      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
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
          {!mfaRequired && mode !== 'reset' && (
            <div className="mb-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium transition-colors flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                </div>
              </div>
            </div>
          )}

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
