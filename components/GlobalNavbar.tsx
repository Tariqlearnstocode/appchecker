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
    <header className="bg-[#fafafa] border-b border-neutral-200/60 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-neutral-900">IncomeChecker.com</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-2.5">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 text-sm text-neutral-600 bg-white rounded-lg border border-neutral-200/80">
                  <User className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline truncate max-w-[120px] md:max-w-none">{user.email}</span>
                </div>
                <Link
                  href="/settings"
                  className="flex items-center justify-center w-9 h-9 text-neutral-500 hover:text-neutral-700 hover:bg-white rounded-lg border border-neutral-200/80 transition-colors flex-shrink-0"
                  aria-label="Settings"
                >
                  <Settings className="w-4 h-4" />
                </Link>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-700 hover:bg-white rounded-lg border border-neutral-200/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  aria-label={signingOut ? 'Signing out' : 'Sign Out'}
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{signingOut ? 'Signing out...' : 'Sign Out'}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleOpenAuthModal('signin')}
                  className="hidden sm:inline-block px-4 py-1.5 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleOpenAuthModal('signup')}
                  className="px-4 py-2 text-sm bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-medium transition-colors"
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
