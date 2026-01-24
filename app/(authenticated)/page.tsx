import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
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
  let user = null;
  
  try {
    user = await getUser(supabase);
  } catch (authError: any) {
    // Rate limit errors are common in development with HMR - don't log as errors
    if (authError?.code === 'over_request_rate_limit') {
      // Silently handle rate limits - user will be null, which is fine
    } else if (authError?.message && !authError.message.includes('Auth session missing')) {
      console.error('HomePage: Auth error:', authError.message);
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
