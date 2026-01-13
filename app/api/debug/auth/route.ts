import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { createClient as createBrowserClient } from '@/utils/supabase/client';

/**
 * Debug endpoint to test server-side vs client-side auth state
 * This helps identify cookie/session sync issues
 */
export async function GET(request: NextRequest) {
  try {
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      serverSide: {},
      cookies: {},
    };

    // 1. Read cookies directly from next/headers
    try {
      const cookieStore = await cookies();
      const allCookies = cookieStore.getAll();
      debugInfo.cookies = {
        count: allCookies.length,
        names: allCookies.map(c => c.name),
        supabaseCookies: allCookies.filter(c => c.name.startsWith('sb-')).map(c => ({
          name: c.name,
          hasValue: !!c.value,
          valueLength: c.value?.length || 0,
        })),
      };
      console.log('[Cookie] Debug endpoint: Found cookies:', debugInfo.cookies);
    } catch (cookieError: any) {
      console.error('[Cookie] Debug endpoint: Error reading cookies:', cookieError.message);
      debugInfo.cookies.error = cookieError.message;
    }

    // 2. Try server-side getUser()
    try {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      debugInfo.serverSide = {
        hasUser: !!user,
        userId: user?.id || null,
        userEmail: user?.email || null,
        error: authError ? {
          message: authError.message,
          status: authError.status,
        } : null,
      };
    } catch (serverError: any) {
      console.error('Debug endpoint: Server-side error:', serverError.message);
      debugInfo.serverSide.error = serverError.message;
    }

    // 3. Instructions for client-side test
    debugInfo.clientSideInstructions = {
      message: 'To test client-side auth, open browser console and run:',
      code: `
        import { createClient } from '@/utils/supabase/client';
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Client-side user:', user);
      `,
    };

    return NextResponse.json(debugInfo, { status: 200 });
  } catch (error: any) {
    console.error('[Debug] Auth endpoint error:', error);
    return NextResponse.json(
      { error: 'Debug endpoint failed', details: error.message },
      { status: 500 }
    );
  }
}
