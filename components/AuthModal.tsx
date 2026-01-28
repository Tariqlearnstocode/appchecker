'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeCompanyName } from '@/utils/sanitize';
import { getURL } from '@/utils/helpers';

type AuthMode = 'signin' | 'signup' | 'reset';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  onAuthSuccess?: () => void | Promise<void>;
  initialEmail?: string;
  initialCompanyName?: string;
  initialFirstName?: string;
  initialLastName?: string;
  initialIndustry?: string;
}

export function AuthModal({ isOpen, onClose, initialMode = 'signup', onAuthSuccess, initialEmail = '', initialCompanyName = '', initialFirstName = '', initialLastName = '', initialIndustry = '' }: AuthModalProps) {
  const { supabase } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
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

  // Reset mode and populate initial values when modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
      setResetEmailSent(false);
      setMfaRequired(false);
      setMfaCode('');
      setMfaChallengeId(null);
      setMfaFactors([]);
      // Pre-populate email from initial values
      if (initialEmail) {
        setEmail(initialEmail);
      }
    }
  }, [isOpen, initialMode, initialEmail]);

  if (!isOpen) return null;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // If initialCompanyName was provided (from form pre-fill), save it silently
      const metadata: any = {};
      if (initialCompanyName) {
        metadata.company_name = sanitizeCompanyName(initialCompanyName);
      }
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        ...(Object.keys(metadata).length > 0 && {
          options: {
            data: metadata
          }
        })
      });

      if (signUpError) throw signUpError;

      // Create Stripe customer for the new user
      if (signUpData.user) {
        try {
          const response = await fetch('/api/stripe/create-customer', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: signUpData.user.id,
              email: signUpData.user.email || email,
            }),
          });
          
          if (!response.ok) {
            console.error('Failed to create Stripe customer, but user account was created');
            // Don't fail sign up if Stripe customer creation fails
            // Customer will be created lazily on first payment
          }
        } catch (stripeError) {
          console.error('Error creating Stripe customer:', stripeError);
          // Don't fail sign up if Stripe customer creation fails
        }
      }

      // Success - modal will close via onAuthStateChange in AuthContext
      onClose();
      // Call onAuthSuccess callback if provided
      if (onAuthSuccess) {
        await onAuthSuccess();
      }
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
      // Store password for potential MFA flow
      setPendingPassword(password);
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setPendingPassword('');
        throw signInError;
      }

      // If we have a session, immediately check for MFA factors
      if (data.session) {
        const { data: factorsData } = await supabase.auth.mfa.listFactors();
        const totpFactors = factorsData?.totp || [];
        
        // If user has MFA factors, sign out IMMEDIATELY before AuthContext can react
        if (totpFactors.length > 0) {
          // Sign out immediately - this must happen before any state updates
          await supabase.auth.signOut();
          
          // Now re-authenticate to get a session for MFA challenge
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
          
          // Sign out again - user should NOT be authenticated until MFA is verified
          await supabase.auth.signOut();
          
          setMfaRequired(true);
          setMfaFactors(totpFactors);
          setMfaChallengeId(challengeData.id);
          setLoading(false);
          return;
        }
      }

      // No MFA required - clear pending password and proceed
      setPendingPassword('');

      // Success - modal will close via onAuthStateChange in AuthContext
      onClose();
      // Call onAuthSuccess callback if provided
      if (onAuthSuccess) {
        await onAuthSuccess();
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
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

      // Re-authenticate with password to get a session for MFA verification
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
        // Sign out on verification failure - this is expected, not an error
        await supabase.auth.signOut();
        // Don't show error message - just reset and let user try again
        setMfaCode('');
        setVerifyingMfa(false);
        return;
      }

      // Clear pending password - user is now fully authenticated
      setPendingPassword('');

      // Success - modal will close via onAuthStateChange in AuthContext
      onClose();
      // Call onAuthSuccess callback if provided
      if (onAuthSuccess) {
        await onAuthSuccess();
      }
    } catch (err: any) {
      // Only handle unexpected errors, not MFA verification failures
      if (err.message && !err.message.includes('verification') && !err.message.includes('code') && !err.message.includes('MFA')) {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      } else {
        // Don't show error for MFA verification failures - just reset
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
          redirectTo: `${getURL()}/auth/callback?next=/`,
        },
      });

      if (oauthError) throw oauthError;
      // Modal will close when user is redirected
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  const handleClose = () => {
    // If MFA is required, don't allow closing the modal - user must complete MFA or sign out
    if (mfaRequired) {
      // Sign out the user if they try to close during MFA
      supabase.auth.signOut();
    }
    
    setError('');
    setEmail('');
    setPassword('');
    setResetEmailSent(false);
    setMfaRequired(false);
    setMfaCode('');
    setMfaChallengeId(null);
    setMfaFactors([]);
    setPendingPassword('');
    setMode(initialMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {mfaRequired 
                ? 'Enter verification code' 
                : mode === 'signup' 
                ? 'Create your account' 
                : mode === 'signin' 
                ? 'Welcome back' 
                : 'Reset password'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {mfaRequired
                ? 'Enter the 6-digit code from your authenticator app'
                : mode === 'signup' 
                ? 'Sign up to create your verification request' 
                : mode === 'signin'
                ? 'Sign in to continue'
                : 'Enter your email to receive a password reset link'}
            </p>
          </div>
          {!mfaRequired && (
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {!mfaRequired && mode !== 'reset' && (
          <div className="px-6 pt-6">
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
          className="p-6 space-y-4"
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
                <label htmlFor="mfa-code" className="block text-sm font-medium text-gray-700 mb-1">
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
                  // Sign out if user goes back
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
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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

        <div className="px-6 pb-6 text-center">
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
  );
}
