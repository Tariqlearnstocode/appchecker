import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/utils/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('[Create Verification] Auth check:', { 
      hasUser: !!user, 
      userId: user?.id,
      authError: authError?.message 
    });
    
    if (!user) {
      console.error('[Create Verification] No user found, authError:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { individual_name, individual_email, requested_by_name, requested_by_email, purpose } = body;
    
    if (!individual_name || !individual_email) {
      return NextResponse.json(
        { error: 'Individual name and email are required' },
        { status: 400 }
      );
    }
    
    // Get user's company name if not provided
    const { data: userProfile } = await supabase
      .from('users')
      .select('company_name')
      .eq('id', user.id)
      .single() as any;
    
    const finalRequestedByName = requested_by_name || (userProfile as { company_name?: string | null } | null)?.company_name || user.email || 'Requesting Party';
    const finalRequestedByEmail = requested_by_email || user.email;
    
    // Create verification
    const { data: verification, error: createError } = await supabase
      .from('income_verifications')
      .insert({
        individual_name,
        individual_email,
        requested_by_name: finalRequestedByName,
        requested_by_email: finalRequestedByEmail,
        purpose: purpose || null,
        user_id: user.id,
      } as any)
      .select()
      .single() as { data: { id: string } | null; error: any };
    
    if (createError) {
      console.error('Error creating verification:', createError);
      return NextResponse.json(
        { error: 'Failed to create verification' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      verification,
      message: 'Verification created successfully'
    });
  } catch (error: any) {
    console.error('Error in create verification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
