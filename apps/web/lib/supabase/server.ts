import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ENV, SUPABASE_CONFIGURED } from '../env';

/**
 * Server-side Supabase client used inside Server Components, Route
 * Handlers and Server Actions.  Per the @supabase/ssr Next.js recipe,
 * the cookie methods delegate to `next/headers`' `cookies()` so the
 * session is shared between RSC reads and middleware writes.
 *
 * Reference: https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function getServerSupabase(): Promise<SupabaseClient> {
  const cookieStore = cookies();

  return createServerClient(
    ENV.supabaseUrl || 'https://placeholder.supabase.co',
    ENV.supabaseAnonKey || 'placeholder',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Server Components can't write cookies.  The OAuth callback
            // route handler is the only place that legitimately writes —
            // everywhere else we silently ignore.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Same rationale as `set`.
          }
        },
      },
    },
  );
}

export { SUPABASE_CONFIGURED };
