import { createClient } from '@/utils/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Get the Authenticator Assurance Level (AAL) from the current session
 * AAL1 = Single-factor authentication (password only)
 * AAL2 = Multi-factor authentication (password + MFA)
 * 
 * @param supabase Optional Supabase client. If not provided, creates a new one.
 * @returns 'aal1' | 'aal2' | null
 */
export async function getAAL(supabase?: SupabaseClient): Promise<'aal1' | 'aal2' | null> {
  try {
    const client = supabase || await createClient();
    const { data: { session } } = await client.auth.getSession();
    
    if (!session) {
      return null;
    }

    // Decode JWT to get AAL claim
    const payload = JSON.parse(
      Buffer.from(session.access_token.split('.')[1], 'base64').toString()
    );
    
    const aal = payload.aal as string | undefined;
    
    if (aal === 'aal2') {
      return 'aal2';
    }
    
    // Default to aal1 if not specified
    return 'aal1';
  } catch (error) {
    console.error('Error getting AAL:', error);
    return null;
  }
}

/**
 * Get AAL from a session object directly (for middleware)
 * 
 * @param session Session object from Supabase
 * @returns 'aal1' | 'aal2' | null
 */
export function getAALFromSession(session: { access_token: string } | null): 'aal1' | 'aal2' | null {
  if (!session) {
    return null;
  }

  try {
    // Decode JWT to get AAL claim
    const payload = JSON.parse(
      Buffer.from(session.access_token.split('.')[1], 'base64').toString()
    );
    
    const aal = payload.aal as string | undefined;
    
    if (aal === 'aal2') {
      return 'aal2';
    }
    
    // Default to aal1 if not specified
    return 'aal1';
  } catch (error) {
    console.error('Error getting AAL from session:', error);
    return null;
  }
}

/**
 * Check if the current session has AAL2 (MFA enabled)
 * 
 * @param supabase Optional Supabase client. If not provided, creates a new one.
 * @returns true if AAL2, false otherwise
 */
export async function hasAAL2(supabase?: SupabaseClient): Promise<boolean> {
  const aal = await getAAL(supabase);
  return aal === 'aal2';
}

/**
 * Require AAL2 for sensitive operations
 * Throws an error if AAL2 is not present
 * 
 * @param supabase Optional Supabase client. If not provided, creates a new one.
 * @throws Error if AAL2 is not present
 */
export async function requireAAL2(supabase?: SupabaseClient): Promise<void> {
  const aal = await getAAL(supabase);
  if (aal !== 'aal2') {
    throw new Error('Multi-factor authentication is required for this operation');
  }
}
