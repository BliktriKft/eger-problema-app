import type { Institution, Problem, ProblemMarker, WikiEntry } from '@/types';
import { ENV, USE_MOCK } from '../env';
import { mockFetch } from './mock';

/**
 * Thin typed wrapper around the NestJS backend (apps/api).
 *
 *  - Sends a Bearer token from Supabase on every request when one is given.
 *  - Throws `ApiError` on non-2xx so TanStack Query's onError / retry logic
 *    sees a real status code.
 *  - When USE_MOCK is true (default in CI / no-API dev), it falls through
 *    to an in-memory mock that mirrors the F2 demo dataset so the UI stays
 *    demo-able even without the backend running.
 *
 * Mirrors the pattern from apps/mobile/lib/api.ts.
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

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Query-string params; undefined values are skipped. */
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  /**
   * Supabase access token; pass `null` to skip the Authorization header
   * (the server's `@Public()` decorator will then opt the endpoint out).
   */
  accessToken?: string | null;
  /**
   * Force the call through the in-memory mock dataset (skips the network).
   * Defaults to the global USE_MOCK flag.
   */
  useMock?: boolean;
}

function buildUrl(path: string, query?: ApiOptions['query']): string {
  const url = new URL(ENV.apiBaseUrl + (path.startsWith('/') ? path : `/${path}`));
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

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
    // Next.js: don't cache authenticated/POST requests.
    cache: 'no-store',
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

// ----- Domain helpers -----------------------------------------------------

/** GET /api/problems?category=&status=&page=&pageSize=&institutionId= */
export async function listProblems(
  filters: {
    category?: string;
    status?: string;
    page?: number;
    pageSize?: number;
    institutionId?: string;
  } = {},
  accessToken?: string | null,
): Promise<Problem[]> {
  return api<Problem[]>('/api/problems', { query: filters as Record<string, string | number | undefined>, accessToken });
}

/** GET /api/problems/nearby */
export async function listNearbyProblems(
  params: { latitude: number; longitude: number; radiusMeters: number; category?: string },
  accessToken?: string | null,
): Promise<ProblemMarker[]> {
  return api<ProblemMarker[]>('/api/problems/nearby', { query: params as Record<string, number | string>, accessToken });
}

/** GET /api/problems/:id */
export async function getProblem(id: string, accessToken?: string | null): Promise<Problem> {
  return api<Problem>(`/api/problems/${encodeURIComponent(id)}`, { accessToken });
}

/** POST /api/problems */
export async function createProblem(
  body: {
    title: string;
    description: string;
    category: string;
    institutionId?: string | null;
    latitude: number;
    longitude: number;
  },
  accessToken: string,
): Promise<Problem> {
  return api<Problem>('/api/problems', { method: 'POST', body, accessToken });
}

/** POST /api/problems/:id/vote */
export async function castVote(problemId: string, value: 1 | -1, accessToken: string): Promise<{ score: number }> {
  return api<{ score: number }>(`/api/problems/${encodeURIComponent(problemId)}/vote`, {
    method: 'POST',
    body: { value },
    accessToken,
  });
}

/** GET /api/institutions */
export async function listInstitutions(
  query: { q?: string; type?: string; search?: string; limit?: number } = {},
  accessToken?: string | null,
): Promise<Institution[]> {
  // Backend's QueryInstitutionsDto accepts `search` (not `q`) — map it.
  const { q, ...rest } = query;
  const merged: Record<string, string | number | undefined> = { ...rest };
  if (q !== undefined && rest.search === undefined) merged.search = q;
  return api<Institution[]>('/api/institutions', { query: merged, accessToken });
}

/** GET /api/institutions/:id */
export async function getInstitution(id: string, accessToken?: string | null): Promise<Institution> {
  return api<Institution>(`/api/institutions/${encodeURIComponent(id)}`, { accessToken });
}

/**
 * POST /api/institutions — admin-only.
 * The NestJS backend's admin endpoints are not yet implemented
 * (apps/api/src/modules/institutions/institutions.controller.ts ships
 * only GET). The frontend wires the call so the admin UI works in
 * mock mode and lights up as soon as the backend lands the controller.
 */
export interface CreateInstitutionInput {
  name: string;
  type: Institution['type'];
  address: string;
  latitude: number;
  longitude: number;
  officialUrl: string | null;
}
export async function createInstitution(
  body: CreateInstitutionInput,
  accessToken: string,
): Promise<Institution> {
  return api<Institution>('/api/institutions', { method: 'POST', body, accessToken });
}

/** PATCH /api/institutions/:id — admin-only. */
export async function updateInstitution(
  id: string,
  body: Partial<CreateInstitutionInput>,
  accessToken: string,
): Promise<Institution> {
  return api<Institution>(`/api/institutions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body,
    accessToken,
  });
}

/** DELETE /api/institutions/:id — admin-only. */
export async function deleteInstitution(id: string, accessToken: string): Promise<void> {
  await api<void>(`/api/institutions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    accessToken,
  });
}

/** GET /api/problems/:id/wiki */
export async function getWiki(problemId: string, accessToken?: string | null): Promise<WikiEntry | null> {
  try {
    return await api<WikiEntry>(`/api/problems/${encodeURIComponent(problemId)}/wiki`, { accessToken });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export type { Institution, Problem, ProblemMarker, WikiEntry };
