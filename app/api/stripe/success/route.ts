import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session_id');
  const verificationId = searchParams.get('verification_id');
  
  // Redirect to the full report
  if (verificationId) {
    return NextResponse.redirect(
      new URL(`/report/${verificationId}?unlocked=true`, request.url)
    );
  }
  
  // Fallback to home
  return NextResponse.redirect(new URL('/', request.url));
}

