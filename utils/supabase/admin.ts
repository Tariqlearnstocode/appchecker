import { createClient } from '@supabase/supabase-js';
import type { Database } from 'types_db';

// Note: supabaseAdmin uses the SECRET_KEY which you must only use in a secure server-side context
// as it has admin privileges and overwrites RLS policies!
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SECRET_KEY || ''
);
