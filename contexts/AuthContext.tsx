'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { User, SupabaseClient } from '@supabase/supabase-js';
import { getRef, clearRef } from '@/utils/captureRef';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  supabase: SupabaseClient<any, 'public', any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ 
  children, 
  initialUser 
}: { 
  children: React.ReactNode; 
  initialUser: User | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Set initial user once on mount
  useEffect(() => {
    setUser(initialUser);
  }, []); // Only run once on mount

  // Set up auth state listener once
  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        // Clear localStorage on sign out
        if (typeof window !== 'undefined') {
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.startsWith('sb-')) {
              localStorage.removeItem(key);
            }
          });
        }
      } else {
        setUser(session.user);

        // OAuth backfill: update ref for new signups (Google, etc.) when ref was captured
        if (event === 'SIGNED_IN' && typeof window !== 'undefined') {
          const ref = getRef();
          if (ref !== 'organic') {
            fetch('/api/users/update-ref', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ref }),
            }).finally(clearRef);
          }
        }
      }

      // Only refresh on actual auth state changes, not on every render
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]); // Don't include initialUser - listener should only be set up once

  return (
    <AuthContext.Provider value={{ user, loading, supabase }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
