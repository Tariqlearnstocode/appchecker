import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/utils/supabase/admin';

const REF_REGEX = /^[a-zA-Z0-9_]{1,50}$/;
const UTM_REGEX = /^[a-zA-Z0-9_-]{1,255}$/;

function validUtm(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed && UTM_REGEX.test(trimmed) ? trimmed : null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const ref = typeof body?.ref === 'string' ? body.ref.trim() : '';
    const utm_source = validUtm(body?.utm_source);
    const utm_medium = validUtm(body?.utm_medium);
    const utm_campaign = validUtm(body?.utm_campaign);

    const hasRef = ref && REF_REGEX.test(ref);
    const hasUtm = utm_source || utm_medium || utm_campaign;

    if (!hasRef && !hasUtm) {
      return NextResponse.json({ error: 'ref or utm params required' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('ref')
      .eq('id', user.id)
      .single() as { data: { ref?: string | null } | null };

    const currentRef = profile?.ref ?? 'organic';
    const canUpdateRef = hasRef && (currentRef === null || currentRef === 'organic');

    const update: Record<string, string> = {};
    if (canUpdateRef) update.ref = ref;
    if (utm_source) update.utm_source = utm_source;
    if (utm_medium) update.utm_medium = utm_medium;
    if (utm_campaign) update.utm_campaign = utm_campaign;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: true });
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update(update as any)
      .eq('id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating ref/utm:', error);
    return NextResponse.json(
      { error: 'Failed to update ref/utm', details: error.message },
      { status: 500 }
    );
  }
}
