import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/utils/supabase/admin';

const REF_REGEX = /^[a-zA-Z0-9_]{1,50}$/;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const ref = typeof body?.ref === 'string' ? body.ref.trim() : '';

    if (!ref || !REF_REGEX.test(ref)) {
      return NextResponse.json({ error: 'Invalid ref' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('ref')
      .eq('id', user.id)
      .single() as { data: { ref?: string | null } | null };

    const currentRef = profile?.ref ?? 'organic';
    if (currentRef !== null && currentRef !== 'organic') {
      return NextResponse.json({ success: true }); // Already has a ref, don't overwrite
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ ref } as any)
      .eq('id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating ref:', error);
    return NextResponse.json(
      { error: 'Failed to update ref', details: error.message },
      { status: 500 }
    );
  }
}
