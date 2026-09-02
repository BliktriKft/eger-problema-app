// apps/mobile/lib/mock-problems.ts
//
// In-memory dataset for the mobile app, used whenever the live NestJS
// API isn't reachable (`EXPO_PUBLIC_USE_MOCK=true` or no API base URL).
//
// Coordinates trace a loose ring around Eger belváros so the OSMap
// tiles + markers line up visually out of the box.

import type { Problem, ProblemMarker } from '@/types';

export const MOCK_PROBLEM_MARKERS: ProblemMarker[] = [
  { id: 'mock-1', title: 'Nagy kátyú a Kossuth utcán', category: 'infrastructure', status: 'open', latitude: 47.9025, longitude: 20.3772, score: 12 },
  { id: 'mock-2', title: 'Nem működik a közvilágítás a Kertész utcában', category: 'infrastructure', status: 'investigating', latitude: 47.9050, longitude: 20.3810, score: 4 },
  { id: 'mock-3', title: 'Elhagyatott bicikli a főtér sarkán', category: 'public_safety', status: 'open', latitude: 47.9010, longitude: 20.3750, score: -1 },
  { id: 'mock-4', title: 'Szemetes a Szépasszony-völgyben túlcsordult', category: 'environment', status: 'open', latitude: 47.8990, longitude: 20.3700, score: 7 },
  { id: 'mock-5', title: 'Iskolai bejárat akadálymentesítése', category: 'institution', status: 'resolved', latitude: 47.9055, longitude: 20.3700, score: 3 },
  { id: 'mock-6', title: 'Buszmegálló fedél nélkül a Knézich utcán', category: 'transport', status: 'open', latitude: 47.8980, longitude: 20.3790, score: 9 },
  { id: 'mock-7', title: 'Játszótéri homokozó elavult', category: 'other', status: 'closed', latitude: 47.9035, longitude: 20.3840, score: 0 },
  { id: 'mock-8', title: 'Dómtéri pad törött', category: 'public_safety', status: 'investigating', latitude: 47.9018, longitude: 20.3798, score: 2 },
  { id: 'mock-9', title: 'Hulladék a patakmederben', category: 'environment', status: 'open', latitude: 47.9040, longitude: 20.3720, score: 6 },
  { id: 'mock-10', title: 'Közlekedési tábla hiányzik a Rákóczi úton', category: 'transport', status: 'open', latitude: 47.8998, longitude: 20.3780, score: 5 },
];

export const MOCK_PROBLEM_DETAILS: Record<string, Problem> = Object.fromEntries(
  MOCK_PROBLEM_MARKERS.map((m, idx) => [
    m.id,
    {
      ...m,
      description:
        idx === 0
          ? 'A Kossuth utca 12. előtt már több mint két hete nagy kátyú van, ami balesetveszélyes a gyalogosoknak és a kerékpárosoknak egyaránt. A szolgáltató többszöri bejelentés ellenére sem javította.'
          : idx === 1
          ? 'A Kertész utca északi szakaszán négy lámpaoszlop nem világít, a gyalogos átkelő sötétben van — közlekedésbiztonsági kockázat.'
          : idx === 2
          ? 'A főtér északi sarkán hetek óta áll egy elhagyatott, láncra kötött bicikli, amely akadályozza a járdán a közlekedést.'
          : `A leírást a NestJS API szolgáltatja majd. Ez a placeholder szöveg a UI-t teszteli: a kártya, a vote gombok, a wiki szekció és a státusz badge mind megjelennek. (mock-${idx + 1})`,
      institutionId: idx % 3 === 0 ? 'mock-inst-egri-polgarmesteri-hivatal' : null,
      institutionName: idx % 3 === 0 ? 'Egri Polgármesteri Hivatal' : null,
      createdBy: 'mock-user',
      createdAt: new Date(Date.now() - idx * 86_400_000).toISOString(),
    } satisfies Problem,
  ]),
);
