# Auth Cookie Handling Comparison

## Key Finding

Both API routes and Server Components use the **same** `createClient()` function from `@/utils/supabase/server`, which uses `cookies()` from `next/headers`.

## Differences

### API Routes (Working)
- Receive `NextRequest` object with cookies
- Use `await createClient()` which internally calls `await cookies()`
- Cookies are read from the request headers
- **Status**: Working in production

### Server Components (Failing)
- No `NextRequest` object available
- Use `await createClient()` which internally calls `await cookies()`
- Cookies are read from `next/headers` directly
- **Status**: Failing in production (getUser() returns null)

## Hypothesis

The issue is likely:
1. **Cookie reading timing**: Server Components may be reading cookies before they're fully available
2. **Cookie domain/path mismatch**: Cookies set by client might not be accessible to Server Components
3. **Missing middleware**: No middleware exists to refresh sessions before Server Components run
4. **Next.js 15 async cookies**: The `cookies()` function is async in Next.js 15, but there might be a race condition

## Next Steps

1. Check if middleware is needed to refresh sessions
2. Verify cookie domain/path settings match production domain
3. Compare actual cookie values between client and server
4. Check if cookies are being set with correct SameSite/Secure flags
