// apps/mobile/lib/__smoke__/mock.smoke.test.ts
//
// Tiny in-process smoke test for `lib/mock.ts` — verifies the routes
// the mobile app actually exercises (nearby / detail / vote / create
// / wiki) return the right shapes and stay internally consistent
// across calls.
//
// Not part of the Detox E2E suite — just a fast unit-level sanity
// check we can run in CI alongside `pnpm typecheck` to catch regressions
// in the mock without booting the simulator.

import { mockFetch, __mockState } from '../mock';
import { MOCK_PROBLEM_DETAILS } from '../mock-problems';
// Pull the seeded mock data directly so we don't drag the full api.ts
// (and therefore expo-secure-store) into the test runtime.
import type { ProblemMarker } from '../../types';

describe('mock backend', () => {
  beforeEach(() => {
    // Reset the in-memory state so each test is independent.
    __mockState.problems.clear();
    __mockState.markers.length = 0;
    // Seed the canonical Eger dataset so the detail / vote tests have
    // something to look at.
    for (const [id, p] of Object.entries(MOCK_PROBLEM_DETAILS)) {
      __mockState.problems.set(id, p);
      __mockState.markers.push({
        id: p.id,
        title: p.title,
        category: p.category,
        status: p.status,
        latitude: p.latitude,
        longitude: p.longitude,
        score: p.score,
      });
    }
  });

  it('returns the marker list from /api/problems/nearby', async () => {
    const markers = await mockFetch('/api/problems/nearby', {
      method: 'GET',
      query: { latitude: 47.9, longitude: 20.4, radiusMeters: 2000 },
    });
    expect(Array.isArray(markers)).toBe(true);
    expect(markers.length).toBeGreaterThan(0);
    expect(markers[0]).toHaveProperty('id');
    expect(markers[0]).toHaveProperty('latitude');
  });

  it('creates a problem and returns the full record', async () => {
    const created = await mockFetch('/api/problems', {
      method: 'POST',
      body: {
        title: 'Kátyú a Széchenyi utcán',
        description: 'Nagy kátyú az út közepén, balesetveszélyes.',
        category: 'infrastructure',
        latitude: 47.9025,
        longitude: 20.3772,
      },
    });
    expect((created as { id: string }).id).toMatch(/^mock-new-/);
    expect((created as { title: string }).title).toBe('Kátyú a Széchenyi utcán');
    expect((created as { score: number }).score).toBe(0);
    expect((created as { status: string }).status).toBe('open');
  });

  it('returns the detail for a seeded problem', async () => {
    const detail = await mockFetch('/api/problems/mock-1');
    const d = detail as { id: string; score: number };
    expect(d.id).toBe('mock-1');
    expect(typeof d.score).toBe('number');
  });

  it('returns 404 for unknown problems', async () => {
    await expect(
      mockFetch('/api/problems/does-not-exist'),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('throws 400 when creating without required fields', async () => {
    await expect(
      mockFetch('/api/problems', {
        method: 'POST',
        body: { title: 'x' /* description + category missing */ },
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('vote bumps the cached score on the seeded problem', async () => {
    const before = (await mockFetch('/api/problems/mock-1')) as { score: number };
    const res = await mockFetch('/api/problems/mock-1/vote', {
      method: 'POST',
      body: { value: 1 },
    });
    expect((res as { score: number }).score).toBe(before.score + 1);
    const after = (await mockFetch('/api/problems/mock-1')) as { score: number };
    expect(after.score).toBe(before.score + 1);
  });

  it('returns null for /wiki when no entry exists', async () => {
    const wiki = await mockFetch('/api/problems/mock-1/wiki');
    expect(wiki).toBeNull();
  });

  it('returns 404 for /wiki on unknown problem', async () => {
    await expect(
      mockFetch('/api/problems/nope/wiki'),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('throws on unsupported routes', async () => {
    await expect(
      mockFetch('/api/this-route-does-not-exist'),
    ).rejects.toMatchObject({ status: 404 });
  });
});
