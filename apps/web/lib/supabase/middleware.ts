import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { ENV, SUPABASE_CONFIGURED, USE_API } from '../env';

/**
 * Middleware-time Supabase client — keeps the auth cookie fresh on every
 * request before the route handler runs.  Recommended by @supabase/ssr
 * for App Router projects.
 *
 * Reference: https://supabase.com/docs/guides/auth/server-side/nextjs
 */

// Routes that REQUIRE an authenticated session in real-API mode.
// In mock mode (USE_API=false) these stay open so the F2 demo and
// the QA offline test path can still exercise them.
const AUTH_GATED_PATHS = ['/submit', '/profile'];

export async function updateSupabaseSession(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next({ request: { headers: request.headers } });

  if (!SUPABASE_CONFIGURED) {
    // No env → no real session.  Auth pages render a "configure me" state
    // and the middleware should stay a no-op.
    return response;
  }

  const supabase = createServerClient(
    ENV.supabaseUrl,
    ENV.supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Server-side backup for the client AuthGate.  In real-API mode an
  // anonymous visitor hitting /submit or /profile gets bounced to
  // /login?next=… so they land back on the same route after auth.
  if (USE_API && !user) {
    const { pathname } = request.nextUrl;
    if (AUTH_GATED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  return response;
}
