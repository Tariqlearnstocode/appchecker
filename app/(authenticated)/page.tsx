import { createClient } from '@/utils/supabase/server';
import HomePageClient from './HomePageClient';
import { Verification } from '@/components/VerificationsTable';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verify Income in Minutes',
  description: 'Create and manage income verification requests. Track verification status and view reports.',
};

// Force dynamic rendering - don't cache this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    // "Auth session missing" is expected when user is logged out - not a real error
    if (!authError.message?.includes('Auth session missing')) {
      console.error('HomePage: Auth error:', authError.message, authError);
    }
  }
  
  // Fetch verifications filtered by user_id if authenticated
  let verifications: Verification[] = [];
  let landlordInfo = { name: '', email: '' };
  
  if (user) {
    const { data, error: verificationsError } = await supabase
      .from('income_verifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (verificationsError) {
      console.error('HomePage: Verifications query error:', verificationsError.message, verificationsError);
    }
    
    verifications = data || [];
    
    // Get user's company name for landlord info
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('company_name')
      .eq('id', user.id)
      .single() as { data: { company_name?: string | null } | null; error: any };
    
    if (profileError) {
      console.error('HomePage: Profile query error:', profileError.message, profileError);
    }
    
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
