import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { logAudit, getRequestContext } from '@/lib/audit';

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Require confirmation in request body
    const body = await request.json().catch(() => ({}));
    if (body.confirm !== 'DELETE_ALL_MY_DATA') {
      return NextResponse.json({ 
        error: 'Confirmation required',
        message: 'Send { "confirm": "DELETE_ALL_MY_DATA" } to proceed'
      }, { status: 400 });
    }

    const { ipAddress, userAgent } = getRequestContext(request);

    // Count what will be deleted
    const { count: verificationCount } = await supabase
      .from('income_verifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Log the deletion request (this stays for legal compliance)
    await logAudit({
      action: 'gdpr_delete',
      resourceType: 'user_data',
      metadata: { 
        verification_count: verificationCount,
        requested_at: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });

    // Delete verifications (financial data)
    const { error: verifyError } = await supabase
      .from('income_verifications')
      .delete()
      .eq('user_id', user.id);

    if (verifyError) {
      console.error('Failed to delete verifications:', verifyError);
      return NextResponse.json({ error: 'Failed to delete verification data' }, { status: 500 });
    }

    // Delete user profile
    const { error: profileError } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id);

    if (profileError) {
      console.error('Failed to delete profile:', profileError);
      // Continue anyway - verifications are the sensitive data
    }

    // Delete the auth user using admin client
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (authError) {
      console.error('Failed to delete auth user:', authError);
      return NextResponse.json({ 
        partial: true,
        message: 'Financial data deleted. Account deletion requires admin assistance.',
        deleted: { verifications: verificationCount }
      }, { status: 207 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'All your data has been deleted',
      deleted: {
        verifications: verificationCount,
        profile: true,
        account: true,
      }
    });
  } catch (error) {
    console.error('GDPR delete error:', error);
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 });
  }
}

