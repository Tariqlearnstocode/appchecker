import { createClient } from '@/utils/supabase/server';
import HomePageClient from './HomePageClient';

// Force dynamic rendering - don't cache this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch verifications filtered by user_id if authenticated
  let verifications = [];
  let landlordInfo = { name: '', email: '' };
  
  if (user) {
    const { data } = await supabase
      .from('income_verifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    verifications = data || [];
    
    // Get user's company name for landlord info
    const { data: userProfile } = await supabase
      .from('users')
      .select('company_name')
      .eq('id', user.id)
      .single() as { data: { company_name?: string | null } | null };
    
    landlordInfo = {
      name: userProfile?.company_name || '',
      email: user.email || '',
    };
  }
  
  return (
    <HomePageClient 
      initialVerifications={verifications}
      initialLandlordInfo={landlordInfo}
    />
  );
}
