'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ENV, SUPABASE_CONFIGURED } from '../env';

/**
 * Browser-side Supabase client.
 *
 * Uses `@supabase/ssr`'s createBrowserClient which persists the session in a
 * cookie that mirrors what the server-rendered route reads via
 * `createServerClient`.  See https://supabase.com/docs/guides/auth/server-side/nextjs
 *
 * If the host hasn't populated `apps/web/.env` yet, we fall back to a
 * placeholder URL — the auth UI then renders a "configure me" state instead
 * of crashing the app on first paint.
 */
export function getBrowserSupabase(): SupabaseClient {
  return createBrowserClient(ENV.supabaseUrl || 'https://placeholder.supabase.co', ENV.supabaseAnonKey || 'placeholder', {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export { SUPABASE_CONFIGURED };
