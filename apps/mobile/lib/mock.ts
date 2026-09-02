// apps/mobile/lib/mock.ts
//
// In-memory implementation of the NestJS backend used when
// `EXPO_PUBLIC_USE_MOCK=true` (or when no API base URL is configured).
//
// Mirrors the apps/web mock so the demo behaviour stays consistent across
// platforms. The mock is stateful across calls (votes / creates mutate
// the local arrays) so optimistic-update flows still get a realistic
// response.  Don't rely on it for anything production-bound.

import type { Problem, ProblemMarker } from '@/types';
import { ApiError } from './api-error';
import { MOCK_PROBLEM_DETAILS, MOCK_PROBLEM_MARKERS } from './mock-problems';

interface MockState {
  problems: Map<string, Problem>;
  markers: ProblemMarker[];
}

const state: MockState = {
  problems: new Map(Object.entries(MOCK_PROBLEM_DETAILS)),
  markers: [...MOCK_PROBLEM_MARKERS],
};

let voteCounter = 0;
let problemCounter = 100;

export interface MockOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

export async function mockFetch<T>(path: string, opts: MockOptions = {}): Promise<T> {
  const { method = 'GET', query, body } = opts;
  await tick(15); // small delay so loading states are still observable

  // --- list ---
  if (path === '/api/problems' && method === 'GET') {
    const list = Array.from(state.problems.values());
    return filteredAndPaged(list, query) as unknown as T;
  }

  // --- create ---
  if (path === '/api/problems' && method === 'POST') {
    const input = body as {
      title?: string;
      description?: string;
      category?: string;
      institutionId?: string | null;
      latitude?: number;
      longitude?: number;
    };
    if (!input?.title || !input.description || !input.category) {
      throw new ApiError(400, { message: 'Missing required fields' }, 'mock 400');
    }
    const id = `mock-new-${++problemCounter}`;
    const created: Problem = {
      id,
      title: input.title,
      description: input.description,
      category: input.category as Problem['category'],
      status: 'open',
      latitude: Number(input.latitude ?? 0),
      longitude: Number(input.longitude ?? 0),
      score: 0,
      institutionId: input.institutionId ?? null,
      institutionName: null,
      createdBy: 'mock-user',
      createdAt: new Date().toISOString(),
    };
    state.problems.set(id, created);
    state.markers.push({
      id,
      title: created.title,
      category: created.category,
      status: created.status,
      latitude: created.latitude,
      longitude: created.longitude,
      score: created.score,
    });
    return created as unknown as T;
  }

  // --- nearby ---
  if (path === '/api/problems/nearby' && method === 'GET') {
    // Mock dataset is small — return everything.  Real backend applies
    // PostGIS distance filter.
    return state.markers as unknown as T;
  }

  // --- detail / patch / delete ---
  const detailMatch = /^\/api\/problems\/([^/]+)$/.exec(path);
  if (detailMatch) {
    const id = decodeURIComponent(detailMatch[1] as string);
    const existing = state.problems.get(id);
    if (!existing) throw new ApiError(404, { message: 'Not found' }, `mock 404 for ${id}`);
    if (method === 'GET') return existing as unknown as T;
    if (method === 'PATCH') {
      const updated: Problem = { ...existing, ...(body as Partial<Problem>) };
      state.problems.set(id, updated);
      const idx = state.markers.findIndex((m) => m.id === id);
      if (idx >= 0) {
        state.markers[idx] = {
          ...state.markers[idx]!,
          title: updated.title,
          category: updated.category,
          status: updated.status,
          score: updated.score,
        };
      }
      return updated as unknown as T;
    }
    if (method === 'DELETE') {
      state.problems.delete(id);
      state.markers = state.markers.filter((m) => m.id !== id);
      return undefined as unknown as T;
    }
  }

  // --- vote ---
  const voteMatch = /^\/api\/problems\/([^/]+)\/vote$/.exec(path);
  if (voteMatch && method === 'POST') {
    const id = decodeURIComponent(voteMatch[1] as string);
    const existing = state.problems.get(id);
    if (!existing) throw new ApiError(404, { message: 'Not found' }, `mock 404 for ${id}`);
    const input = body as { value?: 1 | -1 };
    const value = input?.value ?? 1;
    voteCounter += 1;
    const next: Problem = { ...existing, score: existing.score + value };
    state.problems.set(id, next);
    const idx = state.markers.findIndex((m) => m.id === id);
    if (idx >= 0) state.markers[idx] = { ...state.markers[idx]!, score: next.score };
    return { score: next.score } as unknown as T;
  }

  // --- wiki (mock returns null-equivalent so UI shows the "no wiki yet" state) ---
  const wikiMatch = /^\/api\/problems\/([^/]+)\/wiki$/.exec(path);
  if (wikiMatch && method === 'GET') {
    const id = decodeURIComponent(wikiMatch[1] as string);
    if (!state.problems.has(id)) {
      throw new ApiError(404, { message: 'Not found' }, `mock 404 for ${id}`);
    }
    return null as unknown as T;
  }

  throw new ApiError(
    404,
    { message: `Mock has no route for ${method} ${path}` },
    `mock 404 for ${method} ${path}`,
  );
}

function filteredAndPaged<T extends { status?: string; category?: string; institutionId?: string | null }>(
  list: T[],
  query?: Record<string, string | number | boolean | undefined>,
): T[] {
  let out = list;
  const category = query?.category as string | undefined;
  const status = query?.status as string | undefined;
  const institutionId = query?.institutionId as string | undefined;
  if (category) out = out.filter((p) => p.category === category);
  if (status) out = out.filter((p) => p.status === status);
  if (institutionId) out = out.filter((p) => p.institutionId === institutionId);
  return out;
}

function tick(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Exposed for tests — do NOT touch from product code. */
export const __mockState = state;
