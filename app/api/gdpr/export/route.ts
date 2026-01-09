import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logAudit, getRequestContext } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ipAddress, userAgent } = getRequestContext(request);

    // Log the export request
    await logAudit({
      action: 'export',
      resourceType: 'user_data',
      metadata: { type: 'gdpr_export' },
      ipAddress,
      userAgent,
    });

    // Fetch user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    // Fetch all verifications (without raw financial data for security)
    const { data: verifications } = await supabase
      .from('income_verifications')
      .select('id, created_at, individual_name, individual_email, requested_by_name, requested_by_email, status, completed_at, purpose, monthly_rent')
      .eq('user_id', user.id);

    // Fetch audit logs
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const exportData = {
      exported_at: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        company_name: user.user_metadata?.company_name || profile?.company_name,
      },
      profile: profile || null,
      verifications: verifications || [],
      audit_logs: auditLogs || [],
      _note: 'Raw financial data is excluded from exports for security. Contact support if you need transaction-level data.',
    };

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="data-export-${user.id}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('GDPR export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

