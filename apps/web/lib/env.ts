// apps/web/lib/env.ts
// Read public-only env vars in a single place. We never reach for
// process.env directly outside of this file so that the rest of the app
// stays greppable for what configuration it actually needs.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

/**
 * `NEXT_PUBLIC_USE_MOCK=true` forces every API call through the in-memory
 * mock dataset (lib/mock-problems.ts) regardless of whether the NestJS
 * backend is reachable.  This is what the F2 demo / QA offline test path
 * relies on.
 *
 * Default behaviour (when the flag is unset):
 *   - USE_MOCK = true   if no API base URL is configured
 *   - USE_MOCK = false  if NEXT_PUBLIC_API_BASE_URL points at a real host
 *
 * Setting NEXT_PUBLIC_USE_MOCK=0|false turns the mock off explicitly.
 */
function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  const v = value.trim().toLowerCase();
  if (v === 'true' || v === '1' || v === 'yes' || v === 'on') return true;
  if (v === 'false' || v === '0' || v === 'no' || v === 'off') return false;
  return fallback;
}

const hasApiBase = apiBaseUrl.length > 0;
/** True when the user has populated `apps/web/.env` with real Supabase creds. */
export const SUPABASE_CONFIGURED = Boolean(url) && Boolean(anonKey);

/** True when the NestJS API should be called for real. */
export const USE_API = hasApiBase && !parseBool(process.env.NEXT_PUBLIC_USE_MOCK, false);

/** True when the in-memory mock dataset should be served. */
export const USE_MOCK = !USE_API;

export const ENV = {
  supabaseUrl: url,
  supabaseAnonKey: anonKey,
  apiBaseUrl: apiBaseUrl.replace(/\/$/, ''),
} as const;
