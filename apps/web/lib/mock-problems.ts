/**
 * Mock dataset used in MVP development until the NestJS /api/problems
 * endpoint is reachable from CI.  The seed lives here so both the map and
 * list pages can render against it without an HTTP round-trip.
 *
 * Coordinates trace a loose ring around Eger belváros.
 */

import type { Problem, ProblemMarker } from '@/types';

export const MOCK_PROBLEMS: ProblemMarker[] = [
  { id: 'mock-1', title: 'Nagy kátyú a Kossuth utcán', category: 'infrastructure', status: 'open', latitude: 47.9025, longitude: 20.3772, score: 12 },
  { id: 'mock-2', title: 'Nem működik a közvilágítás a Kertész utcában', category: 'infrastructure', status: 'investigating', latitude: 47.9050, longitude: 20.3810, score: 4 },
  { id: 'mock-3', title: 'Elhagyatott bicikli a főtér sarkán', category: 'public_safety', status: 'open', latitude: 47.9010, longitude: 20.3750, score: -1 },
  { id: 'mock-4', title: 'Szemetes a Szépasszony-völgyben túlcsordult', category: 'environment', status: 'open', latitude: 47.8990, longitude: 20.3700, score: 7 },
  { id: 'mock-5', title: 'Iskolai bejárat akadálymentesítése', category: 'institution', status: 'resolved', latitude: 47.9055, longitude: 20.3700, score: 3 },
  { id: 'mock-6', title: 'Buszmegálló fedél nélkül a Knézich utcán', category: 'transport', status: 'open', latitude: 47.8980, longitude: 20.3790, score: 9 },
  { id: 'mock-7', title: 'Játszótéri homokozó elavult', category: 'other', status: 'closed', latitude: 47.9035, longitude: 20.3840, score: 0 },
];

export const MOCK_PROBLEM_DETAILS: Record<string, Problem> = Object.fromEntries(
  MOCK_PROBLEMS.map((m) => [
    m.id,
    {
      ...m,
      description:
        'A leírást a NestJS API szolgáltatja majd. Ez a placeholder szöveg a UI-t teszteli: a kártya, a vote gombok, a wiki szekció és a státusz badge mind megjelennek. A részleteket később a /api/problems/:id végpont szolgáltatja.',
      institutionId: null,
      createdBy: 'mock-user',
      createdAt: new Date('2026-08-30T08:00:00Z').toISOString(),
      institutionName: null,
    } satisfies Problem,
  ]),
);
