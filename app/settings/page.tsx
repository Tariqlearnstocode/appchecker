import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import SettingsClient from './SettingsClient';

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function SettingsPage({ searchParams }: PageProps) {
  console.log('[ServerAuth] Settings page: Creating Supabase client');
  const supabase = await createClient();
  
  console.log('[ServerAuth] Settings page: Calling getUser()');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    console.error('[ServerAuth] Settings page: Auth error:', authError.message, authError);
  }
  
  console.log('[ServerAuth] Settings page: getUser() result - user:', user?.id || 'null', 'email:', user?.email || 'null');

  if (!user) {
    console.log('[ServerAuth] Settings page: No user found, redirecting to home');
    redirect('/');
  }

  // Get user profile
  console.log('[DBQuery] Settings page: Querying users table for user_id:', user.id);
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single() as { data: { company_name?: string | null } | null; error: any };
  
  if (profileError) {
    console.error('[DBQuery] Settings page: Profile query error:', profileError.message, profileError);
  } else {
    console.log('[DBQuery] Settings page: Profile query result:', profile ? { company_name: profile.company_name } : 'null');
  }

  const { tab } = await searchParams;
  const activeTab = tab || 'profile';

  return <SettingsClient user={user} profile={profile} activeTab={activeTab} />;
}
