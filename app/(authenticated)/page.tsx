import { createClient } from '@/utils/supabase/server';
import HomePageClient from './HomePageClient';
import { Verification } from '@/components/VerificationsTable';

// Force dynamic rendering - don't cache this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  console.log('[ServerAuth] HomePage: Creating Supabase client');
  const supabase = await createClient();
  
  console.log('[ServerAuth] HomePage: Calling getUser()');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    // "Auth session missing" is expected when user is logged out - not a real error
    if (authError.message?.includes('Auth session missing')) {
      console.log('[ServerAuth] HomePage: No active session (user logged out)');
    } else {
      console.error('[ServerAuth] HomePage: Auth error:', authError.message, authError);
    }
  }
  
  console.log('[ServerAuth] HomePage: getUser() result - user:', user?.id || 'null', 'email:', user?.email || 'null');
  
  // Fetch verifications filtered by user_id if authenticated
  let verifications: Verification[] = [];
  let landlordInfo = { name: '', email: '' };
  
  if (user) {
    console.log('[DBQuery] HomePage: Querying income_verifications for user_id:', user.id);
    const { data, error: verificationsError } = await supabase
      .from('income_verifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (verificationsError) {
      console.error('[DBQuery] HomePage: Verifications query error:', verificationsError.message, verificationsError);
    } else {
      console.log('[DBQuery] HomePage: Verifications query result - count:', data?.length || 0);
    }
    
    verifications = data || [];
    
    // Get user's company name for landlord info
    console.log('[DBQuery] HomePage: Querying users table for user_id:', user.id);
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('company_name')
      .eq('id', user.id)
      .single() as { data: { company_name?: string | null } | null; error: any };
    
    if (profileError) {
      console.error('[DBQuery] HomePage: Profile query error:', profileError.message, profileError);
    } else {
      console.log('[DBQuery] HomePage: Profile query result:', userProfile ? { company_name: userProfile.company_name } : 'null');
    }
    
    landlordInfo = {
      name: userProfile?.company_name || '',
      email: user.email || '',
    };
    
    console.log('[ServerAuth] HomePage: Final landlordInfo:', landlordInfo);
  } else {
    console.log('[ServerAuth] HomePage: No user, landlordInfo will be empty');
  }
  
  return (
    <HomePageClient 
      initialVerifications={verifications}
      initialLandlordInfo={landlordInfo}
    />
  );
}
