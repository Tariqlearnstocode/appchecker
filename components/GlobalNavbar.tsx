'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileCheck, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function GlobalNavbar() {
  const pathname = usePathname();
  const { user, supabase } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  
  // Log client-side auth state
  console.log('[ClientAuth] GlobalNavbar: user:', user?.id || 'null', 'email:', user?.email || 'null');
  
  // Don't show navbar on verify pages
  if (pathname?.startsWith('/verify/')) {
    return null;
  }

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setSigningOut(false);
    }
  };

  const handleOpenAuthModal = (mode: 'signin' | 'signup') => {
    window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { mode } }));
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Income Verifier</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 bg-gray-50 rounded-lg">
                  <User className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                <Link
                  href="/settings"
                  className="flex items-center justify-center w-9 h-9 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                  aria-label="Settings"
                >
                  <Settings className="w-4 h-4" />
                </Link>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogOut className="w-4 h-4" />
                  {signingOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleOpenAuthModal('signin')}
                  className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleOpenAuthModal('signup')}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
