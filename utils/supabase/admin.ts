import { createClient } from '@supabase/supabase-js';
import type { Database } from 'types_db';

// Note: supabaseAdmin uses the SECRET_KEY which you must only use in a secure server-side context
// as it has admin privileges and overwrites RLS policies!
// Prefer SUPABASE_SERVICE_ROLE_KEY (Supabase standard); fallback to SUPABASE_SECRET_KEY
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  serviceRoleKey
);
