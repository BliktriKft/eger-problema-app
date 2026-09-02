// apps/mobile/lib/env.ts
// Single source of truth for public environment variables.
//
// Expo inlines `EXPO_PUBLIC_*` values into the JS bundle at build time,
// so we never read `process.env` outside this file — keeps the rest of
// the codebase greppable for what configuration it actually depends on.

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const apiBaseUrlRaw = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  const v = value.trim().toLowerCase();
  if (v === 'true' || v === '1' || v === 'yes' || v === 'on') return true;
  if (v === 'false' || v === '0' || v === 'no' || v === 'off') return false;
  return fallback;
}

const hasApiBase = apiBaseUrlRaw.length > 0;

/** True when the developer populated `apps/mobile/.env` with real Supabase creds. */
export const SUPABASE_CONFIGURED = Boolean(supabaseUrl) && Boolean(supabaseAnonKey);

/**
 * `USE_API = true` ⇔ we should call the live NestJS backend.
 * Defaults to `true` when an API base URL is configured and `EXPO_PUBLIC_USE_MOCK`
 * is not explicitly turned on. Sandbox / QA runs without an API base fall
 * through to the in-memory mock dataset.
 */
export const USE_API = hasApiBase && !parseBool(process.env.EXPO_PUBLIC_USE_MOCK, false);

/** Inverse of USE_API — routes everything through `lib/mock.ts`. */
export const USE_MOCK = !USE_API;

export const ENV = {
  supabaseUrl,
  supabaseAnonKey,
  apiBaseUrl: apiBaseUrlRaw.replace(/\/$/, ''),
} as const;
