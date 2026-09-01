import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { ENV, SUPABASE_CONFIGURED } from '../env';

/**
 * Middleware-time Supabase client — keeps the auth cookie fresh on every
 * request before the route handler runs.  Recommended by @supabase/ssr
 * for App Router projects.
 *
 * Reference: https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function updateSupabaseSession(request: NextRequest): Promise<NextResponse> {
  // Always pass through — middleware never blocks.  The auth-gated routes
  // do their own checks inside the page/route handler so they can show a
  // proper redirect instead of a bare 401.
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

  // Touching getUser() here refreshes the cookie if it's about to expire
  // — see the @supabase/ssr guidance above.
  await supabase.auth.getUser();

  return response;
}
