'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase/client';

// Type declarations for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            nonce?: string;
            use_fedcm_for_prompt?: boolean;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export function GoogleOneTap() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    // Don't show One Tap if:
    // - User is already signed in
    // - On sign-in page (they already have the button)
    // - On localhost (Google One Tap doesn't work reliably on localhost)
    // - Google script not loaded yet
    if (user) {
      console.log('[Google One Tap] Skipping: User already signed in');
      return;
    }
    if (pathname === '/signin') {
      console.log('[Google One Tap] Skipping: On sign-in page');
      return;
    }
    if (isLocalhost) {
      console.log('[Google One Tap] Skipping: Google One Tap is disabled on localhost (not supported reliably). Use the "Sign in with Google" button instead.');
      return;
    }
    if (!scriptLoaded || !window.google) {
      console.log('[Google One Tap] Waiting for Google script to load...', { scriptLoaded, hasGoogle: !!window.google });
      return;
    }

    const initializeGoogleOneTap = async () => {
      console.log('[Google One Tap] Initializing...');
      
      // Check if there's already a session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('[Google One Tap] Skipping: Session exists');
        return; // User is already signed in
      }

      // Generate nonce for security
      const generateNonce = async (): Promise<[string, string]> => {
        const randomBytes = crypto.getRandomValues(new Uint8Array(32));
        const nonce = btoa(String.fromCharCode.apply(null, Array.from(randomBytes)));
        const encoder = new TextEncoder();
        const encodedNonce = encoder.encode(nonce);
        const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        return [nonce, hashedNonce];
      };

      const [nonce, hashedNonce] = await generateNonce();

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        console.warn('[Google One Tap] NEXT_PUBLIC_GOOGLE_CLIENT_ID not configured');
        return;
      }

      const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      // FedCM is Chrome 117+ only; Safari doesn't support it. Use legacy flow when unsupported so One Tap works on Safari.
      const useFedCM = !isLocalhost && typeof window !== 'undefined' && 'IdentityCredential' in window;

      console.log('[Google One Tap] Config:', {
        clientId: clientId.substring(0, 20) + '...',
        isLocalhost,
        useFedCM,
        pathname,
      });

      try {
        window.google?.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential: string }) => {
            console.log('[Google One Tap] Callback received');
            try {
              // Sign in with the ID token from Google
              const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: response.credential,
                nonce,
              });

              if (error) throw error;

              console.log('[Google One Tap] Sign-in successful');
              // Redirect to home page after successful sign-in
              router.push('/');
              router.refresh();
            } catch (error) {
              console.error('[Google One Tap] Error signing in:', error);
            }
          },
          nonce: hashedNonce,
          use_fedcm_for_prompt: useFedCM,
          auto_select: false, // Let user choose their account
          cancel_on_tap_outside: true, // Close when user clicks outside
        });

        // Display the One Tap UI
        console.log('[Google One Tap] Calling prompt()...');
        window.google?.accounts.id.prompt();
        console.log('[Google One Tap] Prompt called - should appear if conditions are met');
      } catch (error) {
        console.error('[Google One Tap] Initialization error:', error);
      }
    };

    // Small delay to ensure Google script is fully loaded
    const timer = setTimeout(initializeGoogleOneTap, 500);
    return () => clearTimeout(timer);
  }, [user, router, pathname, supabase, scriptLoaded]);

  // Don't load the script if:
  // - User is already signed in
  // - On sign-in page
  // - On localhost (One Tap doesn't work on localhost)
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  if (user || pathname === '/signin' || isLocalhost) return null;

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={() => {
        console.log('[Google One Tap] Script loaded');
        setScriptLoaded(true);
      }}
      onError={(e) => {
        console.error('[Google One Tap] Script failed to load:', e);
      }}
    />
  );
}
