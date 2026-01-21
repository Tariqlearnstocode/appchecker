'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeCompanyName } from '@/utils/sanitize';

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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Reset mode and populate initial values when modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
      setResetEmailSent(false);
      // Pre-populate fields from initial values
      if (initialEmail) {
        setEmail(initialEmail);
      }
      if (initialCompanyName) {
        setCompanyName(initialCompanyName);
      }
      if (initialFirstName) {
        setFirstName(initialFirstName);
      }
      if (initialLastName) {
        setLastName(initialLastName);
      }
      if (initialIndustry) {
        setIndustry(initialIndustry);
      }
    }
  }, [isOpen, initialMode, initialEmail, initialCompanyName, initialFirstName, initialLastName, initialIndustry]);

  if (!isOpen) return null;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sanitize inputs before signup
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
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Success - modal will close via onAuthStateChange in AuthContext
      onClose();
      // Call onAuthSuccess callback if provided
      if (onAuthSuccess) {
        await onAuthSuccess();
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
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
    setFirstName('');
    setLastName('');
    setCompanyName('');
    setIndustry('');
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
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 mb-1">
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
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                  Industry (optional)
                </label>
                <select
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                >
                  <option value="">Select an industry</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Property Management">Property Management</option>
                  <option value="Lending">Lending</option>
                  <option value="Financial Services">Financial Services</option>
                  <option value="Housing Authority">Housing Authority</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </>
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
