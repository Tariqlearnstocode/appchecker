'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FileCheck, Settings, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function GlobalNavbar() {
  const { user, loading, supabase } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  async function handleSignOut() {
    console.log('[Navbar] Signing out...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[Navbar] Sign out error:', error);
        return;
      }
      console.log('[Navbar] Sign out successful, redirecting...');
      router.push('/');
    } catch (err) {
      console.error('[Navbar] Sign out exception:', err);
    }
  }

  // Don't show navbar on signin/verify pages
  if (pathname?.startsWith('/signin') || pathname?.startsWith('/verify/') || pathname?.startsWith('/auth/')) {
    return null;
  }

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
            {loading ? (
              <div className="w-20 h-8 bg-gray-100 rounded animate-pulse" />
            ) : user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 bg-gray-50 rounded-lg">
                  <User className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
                <Link href="/settings" className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                  <Settings className="w-5 h-5" />
                </Link>
              </>
            ) : (
              <>
                {pathname === '/' ? (
                  <>
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { mode: 'signin' } }));
                      }}
                      className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { mode: 'signup' } }));
                      }}
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Get Started
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/signin"
                      className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signin/signup"
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
