import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import SettingsClient from './SettingsClient';

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function SettingsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    console.error('Settings page: Auth error:', authError.message, authError);
  }

  if (!user) {
    redirect('/');
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single() as { 
      data: { 
        company_name?: string | null;
        first_name?: string | null;
        last_name?: string | null;
        industry?: string | null;
      } | null; 
      error: any 
    };
  
  if (profileError) {
    console.error('Settings page: Profile query error:', profileError.message, profileError);
  }

  const { tab } = await searchParams;
  const activeTab = tab || 'profile';

  return <SettingsClient user={user} profile={profile} activeTab={activeTab} />;
}
