'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { FileCheck, Settings, LogOut, User } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function GlobalNavbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();

  // Load initial user
  useEffect(() => {
    console.log('[Navbar] Mounting - fetching initial user...');
    supabase.auth.getUser()
      .then(({ data: { user }, error }) => {
        console.log('[Navbar] User fetch completed:', { 
          hasUser: !!user, 
          userEmail: user?.email,
          error: error?.message 
        });
        setUser(user);
        setLoading(false);
        console.log('[Navbar] Loading state set to false');
      })
      .catch((err) => {
        console.error('[Navbar] Error fetching user:', err);
        setLoading(false);
      });
  }, [supabase]);

  // Listen for auth changes
  useEffect(() => {
    console.log('[Navbar] Setting up auth state listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Navbar] Auth state change:', { 
        event, 
        hasUser: !!session?.user,
        userEmail: session?.user?.email 
      });
      setUser(session?.user ?? null);
      
      // Set loading to false on INITIAL_SESSION to handle case where getUser() hangs
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        console.log('[Navbar] Auth listener setting loading to false');
        setLoading(false);
      }
      
      if (event === 'SIGNED_OUT') {
        // Redirect to home if on a protected page
        if (pathname?.startsWith('/settings')) {
          router.push('/');
        }
      }
    });

    return () => {
      console.log('[Navbar] Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, [supabase, pathname, router]);

  async function handleSignOut() {
    console.log('[Navbar] Signing out...');
    await supabase.auth.signOut();
    router.push('/');
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
