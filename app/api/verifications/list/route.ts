import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Verification } from '@/components/VerificationsTable';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('API /verifications/list: Auth error:', authError.message, authError);
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch verifications filtered by user_id
    const { data, error: verificationsError } = await supabase
      .from('income_verifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (verificationsError) {
      console.error('API /verifications/list: Query error:', verificationsError.message, verificationsError);
      return NextResponse.json(
        { error: 'Failed to fetch verifications' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      verifications: (data || []) as Verification[],
    });
  } catch (error: any) {
    console.error('Error in list verifications:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
