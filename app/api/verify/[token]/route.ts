import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase/admin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json(
      { error: 'Token is required' },
      { status: 400 }
    );
  }

  // Use admin client to bypass RLS - we validate the token ourselves
  const { data: verification, error } = await supabaseAdmin
    .from('income_verifications')
    .select('id, individual_name, individual_email, status, expires_at, requested_by_name, requested_by_email, purpose')
    .eq('verification_token', token)
    .single();

  if (error || !verification) {
    return NextResponse.json(
      { error: 'Verification not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ verification });
}
