'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { User, SupabaseClient } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  supabase: SupabaseClient<any, 'public', any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Create client once and reuse it
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    // Get initial user
    console.log('[AuthContext] Initializing...');
    supabase.auth.getUser().then(({ data: { user } }) => {
      console.log('[AuthContext] Initial user:', user?.email || 'none');
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthContext] Auth state change:', { event, userEmail: session?.user?.email || 'none' });
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

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
