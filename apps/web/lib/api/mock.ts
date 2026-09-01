import type { Institution, Problem, ProblemMarker, WikiEntry } from '@/types';
import { MOCK_PROBLEMS, MOCK_PROBLEM_DETAILS } from '../mock-problems';
import { ApiError } from './client';

/**
 * In-memory mock for the NestJS backend.
 *
 * Used when NEXT_PUBLIC_USE_MOCK=true (or when no API base URL is
 * configured). Mirrors the F2 dataset so the demo behaviour stays
 * stable regardless of the backend's availability.
 *
 * The mock is intentionally stateful across calls (votes and creates
 * mutate the local arrays) so the optimistic-update flows still get a
 * realistic response.  Don't rely on it for anything production-bound.
 */

// Mutable copies so each session can vote / create without trampling the
// imported constants.
const state = {
  problems: new Map<string, Problem>(Object.entries(MOCK_PROBLEM_DETAILS)),
  markers: [...MOCK_PROBLEMS] as ProblemMarker[],
  institutions: new Map<string, Institution>(),
};

let mockVoteCounter = 0;
let mockProblemCounter = 100;
let mockInstitutionCounter = 0;

const EGER_SEED: Institution[] = [
  {
    id: 'mock-inst-egri-bolyais-gimnazium',
    name: 'Egri Bolyai János Gimnázium',
    type: 'school',
    address: '3300 Eger, Vörösmarty u. 21.',
    latitude: 47.9034,
    longitude: 20.3766,
    officialUrl: 'https://bolyai-eger.hu',
  },
  {
    id: 'mock-inst-markhot-ferenc-korhaz',
    name: 'Markhot Ferenc Oktatókórház és Rendelőintézet',
    type: 'hospital',
    address: '3300 Eger, Knézich Károly u. 1.',
    latitude: 47.8991,
    longitude: 20.3799,
    officialUrl: 'https://markhot.hu',
  },
  {
    id: 'mock-inst-egri-uszoda',
    name: 'Egri Városi Uszoda és Strand',
    type: 'pool',
    address: '3300 Eger, Frank Tivadar u. 2.',
    latitude: 47.8956,
    longitude: 20.3755,
    officialUrl: null,
  },
  {
    id: 'mock-inst-brunswick-konyvtar',
    name: 'Bródy Sándor Megyei és Városi Könyvtár',
    type: 'library',
    address: '3300 Eger, Kossuth Lajos u. 18.',
    latitude: 47.9028,
    longitude: 20.3779,
    officialUrl: 'https://brdk.hu',
  },
  {
    id: 'mock-inst-egri-polgarmesteri-hivatal',
    name: 'Egri Polgármesteri Hivatal',
    type: 'government',
    address: '3300 Eger, Dobó István tér 2.',
    latitude: 47.9027,
    longitude: 20.3782,
    officialUrl: 'https://eger.hu',
  },
  {
    id: 'mock-inst-gardonyi-geza-gimnazium',
    name: 'Gárdonyi Géza Ciszterci Gimnázium',
    type: 'school',
    address: '3300 Eger, Rákóczi út 1.',
    latitude: 47.9001,
    longitude: 20.3791,
    officialUrl: 'https://ggcg.hu',
  },
  {
    id: 'mock-inst-egri-strand',
    name: 'Bitskey Aladár Uszoda',
    type: 'pool',
    address: '3300 Eger, Fürdő u. 1.',
    latitude: 47.8962,
    longitude: 20.3766,
    officialUrl: null,
  },
  {
    id: 'mock-inst-heves-megyei-kormanyhivatal',
    name: 'Heves Végrehajtó Kormányhivatal',
    type: 'government',
    address: '3300 Eger, Kossuth Lajos u. 9.',
    latitude: 47.9023,
    longitude: 20.3791,
    officialUrl: null,
  },
];

for (const inst of EGER_SEED) state.institutions.set(inst.id, inst);

export interface MockOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

export async function mockFetch<T>(path: string, opts: MockOptions = {}): Promise<T> {
  const { method = 'GET', query, body } = opts;

  // Simulate a tiny network delay so loading states are still testable.
  await tick(15);

  // ----- problems -----
  if (path === '/api/problems' && method === 'GET') {
    const list = Array.from(state.problems.values());
    return filteredAndPaged(list, query) as unknown as T;
  }

  if (path === '/api/problems' && method === 'POST') {
    const input = body as {
      title: string;
      description: string;
      category: string;
      institutionId?: string | null;
      latitude: number;
      longitude: number;
    };
    if (!input?.title || !input.description || !input.category) {
      throw new ApiError(400, { message: 'Missing required fields' }, 'mock 400');
    }
    const id = `mock-new-${++mockProblemCounter}`;
    const created: Problem = {
      id,
      title: input.title,
      description: input.description,
      category: input.category as Problem['category'],
      status: 'open',
      latitude: input.latitude,
      longitude: input.longitude,
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

  if (path === '/api/problems/nearby' && method === 'GET') {
    // The mock dataset is small enough that a "nearby" filter is
    // indistinguishable from "all"; just return all markers.
    return state.markers as unknown as T;
  }

  // /api/problems/:id (GET / PATCH / DELETE)
  const problemMatch = /^\/api\/problems\/([^/]+)$/.exec(path);
  if (problemMatch) {
    const id = decodeURIComponent(problemMatch[1]);
    const existing = state.problems.get(id);
    if (!existing) throw new ApiError(404, { message: 'Not found' }, `mock 404 for ${id}`);
    if (method === 'GET') return existing as unknown as T;
    if (method === 'PATCH') {
      const updated = { ...existing, ...(body as Partial<Problem>) };
      state.problems.set(id, updated);
      return updated as unknown as T;
    }
    if (method === 'DELETE') {
      state.problems.delete(id);
      state.markers = state.markers.filter((m) => m.id !== id);
      return undefined as unknown as T;
    }
  }

  // /api/problems/:id/vote (POST)
  const voteMatch = /^\/api\/problems\/([^/]+)\/vote$/.exec(path);
  if (voteMatch && method === 'POST') {
    const id = decodeURIComponent(voteMatch[1]);
    const existing = state.problems.get(id);
    if (!existing) throw new ApiError(404, { message: 'Not found' }, `mock 404 for ${id}`);
    const input = body as { value: 1 | -1 };
    mockVoteCounter += 1;
    const next: Problem = { ...existing, score: existing.score + input.value };
    state.problems.set(id, next);
    const idx = state.markers.findIndex((m) => m.id === id);
    if (idx >= 0) state.markers[idx] = { ...state.markers[idx], score: next.score };
    return { score: next.score } as unknown as T;
  }

  // /api/problems/:id/wiki (GET) — return null-equivalent for the mock
  const wikiMatch = /^\/api\/problems\/([^/]+)\/wiki$/.exec(path);
  if (wikiMatch && method === 'GET') {
    const id = decodeURIComponent(wikiMatch[1]);
    if (!state.problems.has(id)) throw new ApiError(404, { message: 'Not found' }, `mock 404 for ${id}`);
    return null as unknown as T;
  }

  // /api/institutions
  if (path === '/api/institutions' && method === 'GET') {
    const list = Array.from(state.institutions.values());
    return filteredInstitutions(list, query) as unknown as T;
  }
  if (path === '/api/institutions' && method === 'POST') {
    const input = body as {
      name: string;
      type: Institution['type'];
      address: string;
      latitude: number;
      longitude: number;
      officialUrl: string | null;
    };
    if (!input?.name || !input.type || !input.address) {
      throw new ApiError(400, { message: 'Missing required fields' }, 'mock 400');
    }
    mockInstitutionCounter += 1;
    const id = `mock-inst-new-${mockInstitutionCounter}`;
    const created: Institution = {
      id,
      name: input.name,
      type: input.type,
      address: input.address,
      latitude: Number(input.latitude),
      longitude: Number(input.longitude),
      officialUrl: input.officialUrl ?? null,
    };
    state.institutions.set(id, created);
    return created as unknown as T;
  }

  const institutionMatch = /^\/api\/institutions\/([^/]+)$/.exec(path);
  if (institutionMatch) {
    const id = decodeURIComponent(institutionMatch[1]);
    const existing = state.institutions.get(id);
    if (!existing) throw new ApiError(404, { message: 'Not found' }, `mock 404 for ${id}`);
    if (method === 'GET') return existing as unknown as T;
    if (method === 'PATCH') {
      const updated: Institution = {
        ...existing,
        ...(body as Partial<Institution>),
        latitude: Number((body as { latitude?: number })?.latitude ?? existing.latitude),
        longitude: Number((body as { longitude?: number })?.longitude ?? existing.longitude),
      };
      state.institutions.set(id, updated);
      return updated as unknown as T;
    }
    if (method === 'DELETE') {
      state.institutions.delete(id);
      return undefined as unknown as T;
    }
  }

  throw new ApiError(404, { message: `Mock has no route for ${method} ${path}` }, `mock 404 for ${method} ${path}`);
}

function filteredInstitutions(
  list: Institution[],
  query?: Record<string, string | number | boolean | undefined>,
): Institution[] {
  let out = list;
  const search = (query?.search ?? query?.q) as string | undefined;
  const type = query?.type as string | undefined;
  if (type) out = out.filter((i) => i.type === type);
  if (search) {
    const needle = search.toLowerCase();
    out = out.filter((i) => i.name.toLowerCase().includes(needle) || i.address.toLowerCase().includes(needle));
  }
  const limit = Number(query?.limit ?? 0);
  if (limit > 0) out = out.slice(0, limit);
  return out;
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
  // page/pageSize are accepted but ignored in mock — small dataset.
  return out;
}

function tick(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export const __mockState = state; // exposed for tests; not part of the public surface.
export type MockWikiEntry = WikiEntry;
