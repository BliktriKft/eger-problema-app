// apps/web/lib/env.ts
// Read public-only env vars in a single place. We never reach for
// process.env directly outside of this file so that the rest of the app
// stays greppable for what configuration it actually needs.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

/** True when the user has populated `apps/web/.env` with real Supabase creds. */
export const SUPABASE_CONFIGURED = Boolean(url) && Boolean(anonKey);

export const ENV = {
  supabaseUrl: url,
  supabaseAnonKey: anonKey,
  apiBaseUrl: apiBaseUrl.replace(/\/$/, ''),
} as const;
