import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('API /verifications/delete: Auth error:', authError.message, authError);
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Verification ID is required' },
        { status: 400 }
      );
    }

    // First, verify the verification exists and belongs to the user
    const { data: verification, error: fetchError } = await supabase
      .from('income_verifications')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !verification) {
      return NextResponse.json(
        { error: 'Verification not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the verification
    const { error: deleteError } = await supabase
      .from('income_verifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Double-check ownership in delete query

    if (deleteError) {
      console.error('API /verifications/delete: Delete error:', deleteError.message, deleteError);
      return NextResponse.json(
        { error: 'Failed to delete verification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification deleted successfully',
    });
  } catch (error: any) {
    console.error('Error in delete verification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
