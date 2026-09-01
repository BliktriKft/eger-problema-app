import Constants from 'expo-constants';
import { supabase } from './supabase';

/**
 * Thin typed wrapper around the NestJS backend.  We intentionally avoid
 * axios here — `fetch` is good enough and shaves a few KB off the bundle.
 *
 * Every request carries the current Supabase access token in the
 * `Authorization: Bearer ...` header so the backend's JwtAuthGuard can
 * identify the user.  When the session is missing we send `none` and the
 * server's `@Public()` decorator opts the endpoint out of auth.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Query-string params, serialised with `encodeURIComponent`. */
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
}

function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromEnv && fromEnv.length > 0) return fromEnv.replace(/\/$/, '');
  const fromConfig = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;
  return fromConfig ?? 'http://localhost:8000';
}

export const API_BASE_URL: string = resolveBaseUrl();

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal } = opts;

  const url = new URL(API_BASE_URL + (path.startsWith('/') ? path : `/${path}`));
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      url.searchParams.set(k, String(v));
    }
  }

  // Pull the token fresh on every request — Supabase auto-refreshes so we
  // always get the latest.  Avoid keeping a copy in module state.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  const text = await res.text();
  const parsed: unknown = text ? safeJsonParse(text) : null;

  if (!res.ok) {
    throw new ApiError(
      res.status,
      parsed,
      `[api] ${method} ${path} → ${res.status} ${res.statusText}`,
    );
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
