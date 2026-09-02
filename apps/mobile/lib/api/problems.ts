// apps/mobile/lib/api/problems.ts
//
// Domain helpers that wrap `lib/api.ts` for the problem endpoints.
// Centralised here so the TanStack Query hooks (`lib/api/queries/problems.ts`)
// stay declarative and the auth/access-token plumbing is one place.

import type {
  Problem,
  ProblemMarker,
  WikiEntry,
} from '@/types';
import { api } from '../api';

export interface CreateProblemPayload {
  title: string;
  description: string;
  category: string;
  institutionId?: string | null;
  latitude: number;
  longitude: number;
}

export interface NearbyParams {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  category?: string;
}

export interface ListParams {
  category?: string;
  status?: string;
  institutionId?: string;
  page?: number;
  pageSize?: number;
}

/** GET /api/problems?category=&status=&page=&pageSize=&institutionId= */
export async function listProblems(params: ListParams = {}): Promise<Problem[]> {
  return api<Problem[]>('/api/problems', { query: params as Record<string, string | number | undefined> });
}

/** GET /api/problems/nearby */
export async function listNearbyProblems(params: NearbyParams): Promise<ProblemMarker[]> {
  const query: Record<string, string | number> = {
    latitude: params.latitude,
    longitude: params.longitude,
    radiusMeters: params.radiusMeters,
  };
  if (params.category) query.category = params.category;
  return api<ProblemMarker[]>('/api/problems/nearby', { query });
}

/** GET /api/problems/:id */
export async function getProblem(id: string): Promise<Problem> {
  return api<Problem>(`/api/problems/${encodeURIComponent(id)}`);
}

/** POST /api/problems (auth required) */
export async function createProblem(body: CreateProblemPayload): Promise<Problem> {
  return api<Problem>('/api/problems', { method: 'POST', body });
}

/** POST /api/problems/:id/vote (auth required) */
export async function castVote(problemId: string, value: 1 | -1): Promise<{ score: number }> {
  return api<{ score: number }>(`/api/problems/${encodeURIComponent(problemId)}/vote`, {
    method: 'POST',
    body: { value },
  });
}

/**
 * GET /api/problems/:id/wiki  — returns null on 404 (no wiki generated yet).
 * Mirrors the web app's getWiki() helper so the mobile detail page can
 * render the "wiki coming soon" fallback without a try/catch in every
 * caller.
 */
export async function getWiki(problemId: string): Promise<WikiEntry | null> {
  try {
    return await api<WikiEntry>(`/api/problems/${encodeURIComponent(problemId)}/wiki`);
  } catch (err) {
    if (err instanceof Error && 'status' in err && (err as { status?: number }).status === 404) {
      return null;
    }
    throw err;
  }
}
