import { createClient } from '@/utils/supabase/server';
import HomePageClient from './HomePageClient';

// Force dynamic rendering - don't cache this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const supabase = await createClient();
  
  // Get user on the server - no flash, no client-side guessing
  const { data: { user } } = await supabase.auth.getUser();
  
  let verifications: any[] = [];
  let landlordInfo = { name: '', email: '' };
  
  if (user) {
    // Fetch verifications on the server
    const { data } = await supabase
      .from('income_verifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    verifications = data || [];
    
    // Fetch user profile for landlord defaults
    const { data: profile } = await supabase
      .from('users')
      .select('company_name')
      .eq('id', user.id)
      .single() as { data: { company_name?: string | null } | null };
    
    landlordInfo = {
      name: profile?.company_name || '',
      email: user.email || ''
    };
  }
  
  return (
    <HomePageClient 
      initialUser={user}
      initialVerifications={verifications}
      initialLandlordInfo={landlordInfo}
    />
  );
}
