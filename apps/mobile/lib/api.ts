// apps/mobile/lib/api.ts
//
// Thin typed wrapper around the NestJS backend (apps/api).
//
//   - Sends a Bearer token from Supabase on every request when one is given.
//   - Throws `ApiError` on non-2xx so TanStack Query's onError / retry logic
//     sees a real status code.
//   - When `USE_MOCK` is true (default in CI / no-API dev) it falls through
//     to `lib/mock.ts`, an in-memory mock that mirrors the demo dataset so
//     the UI stays demo-able without the backend running.
//
// Mirrors apps/web/lib/api/client.ts.  The mock split lives in a separate
// module so the production code path is the one that actually exercises
// the real network plumbing.
import Constants from 'expo-constants';
import { supabase } from './supabase';
import { USE_API, USE_MOCK, ENV } from './env';
import { mockFetch } from './mock';
import { ApiError } from './api-error';

export { ApiError };

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Query-string params; undefined values are skipped. */
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  /**
   * Override the access token sent in the `Authorization: Bearer …` header.
   * If omitted (or undefined) we read the current Supabase session.  Pass
   * `null` to explicitly skip the header.
   */
  accessToken?: string | null;
  /**
   * Force this call through the in-memory mock dataset (skips the network),
   * even when the global USE_API flag is true.  Useful for tests + Detox.
   */
  useMock?: boolean;
}

export const API_BASE_URL: string = ENV.apiBaseUrl;

function buildUrl(path: string, query?: ApiOptions['query']): string {
  const url = new URL(API_BASE_URL + (path.startsWith('/') ? path : `/${path}`));
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal, accessToken, useMock } = opts;

  const shouldMock = useMock ?? USE_MOCK;
  if (shouldMock) {
    return mockFetch<T>(path, { method, query, body });
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  } else if (accessToken === undefined) {
    // Pull the token fresh on every request — Supabase auto-refreshes so
    // we always get the latest.  Avoid keeping a copy in module state.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  }

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  const text = await res.text();
  const parsed: unknown = text ? safeJsonParse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, parsed, `[api] ${method} ${path} → ${res.status} ${res.statusText}`);
  }
  return parsed as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// Re-export the flags so consumers (e.g. TanStack Query hooks) can branch on them.
export { USE_API, USE_MOCK };
