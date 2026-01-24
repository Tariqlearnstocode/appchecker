import { type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Refresh auth session before Server Components run
  // This is required for Server Components to read auth cookies correctly
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next/webpack-hmr (webpack HMR)
     * - __webpack_hmr (webpack HMR endpoint)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|_next/webpack-hmr|__webpack_hmr|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
