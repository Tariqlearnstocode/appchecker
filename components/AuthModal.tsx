'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type AuthMode = 'signin' | 'signup' | 'reset';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  onAuthSuccess?: () => void | Promise<void>;
}

export function AuthModal({ isOpen, onClose, initialMode = 'signup', onAuthSuccess }: AuthModalProps) {
  const { supabase } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Reset mode when modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
      setResetEmailSent(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            company_name: companyName || null
          }
        }
      });

      if (signUpError) throw signUpError;

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
    
    console.log('[AuthModal] Starting sign in for:', email);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('[AuthModal] Sign in response:', { 
        error: signInError?.message, 
        user: data?.user?.id || 'null',
        session: data?.session ? 'exists' : 'null'
      });

      if (signInError) throw signInError;

      // Success - modal will close via onAuthStateChange in AuthContext
      console.log('[AuthModal] Sign in successful, closing modal');
      onClose();
      // Call onAuthSuccess callback if provided
      if (onAuthSuccess) {
        await onAuthSuccess();
      }
    } catch (err: any) {
      console.error('[AuthModal] Sign in error:', err);
      setError(err.message || 'Failed to sign in');
      setLoading(false);
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

  const handleClose = () => {
    setError('');
    setEmail('');
    setPassword('');
    setCompanyName('');
    setResetEmailSent(false);
    setMode(initialMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'signup' ? 'Create your account' : mode === 'signin' ? 'Welcome back' : 'Reset password'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {mode === 'signup' 
                ? 'Sign up to create your verification request' 
                : mode === 'signin'
                ? 'Sign in to continue'
                : 'Enter your email to receive a password reset link'}
            </p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form 
          onSubmit={
            mode === 'signup' ? handleSignUp : 
            mode === 'signin' ? handleSignIn : 
            handlePasswordReset
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
          
          {mode === 'signup' && (
            <div>
              <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 mb-1">
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
          )}
          
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
