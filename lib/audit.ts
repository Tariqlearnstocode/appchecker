import { createClient } from '@/utils/supabase/server';

export type AuditAction = 'view' | 'create' | 'update' | 'delete' | 'export' | 'gdpr_delete';
export type ResourceType = 'verification' | 'user_data' | 'report';

interface AuditLogParams {
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an action to the audit trail
 * Should be called from server-side code only
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    // Check env vars first - skip silently if not configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      // Skip audit logging if service role key not available
      return;
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Use admin client for audit logging to bypass RLS
    const { createClient: createAdminClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey);

    await supabaseAdmin.from('audit_logs').insert({
      user_id: user?.id || null,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId || null,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
      metadata: params.metadata || {},
    });
  } catch (error) {
    // Don't throw - audit logging should never break the main flow
    console.error('Failed to write audit log:', error);
  }
}

/**
 * Helper to extract IP and User-Agent from request headers
 */
export function getRequestContext(request: Request): { ipAddress: string; userAgent: string } {
  return {
    ipAddress: request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
}

