'use client';

import * as React from 'react';
import Link from 'next/link';
import { useNearbyProblems } from '@/lib/api/queries/problems';
import { MapShell } from '@/components/map/MapShell';
import { useAuth } from '@/lib/auth-context';
import { MOCK_PROBLEMS } from '@/lib/mock-problems';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { cn } from '@/lib/cn';
import { USE_API } from '@/lib/env';

/**
 * MapScreen — the primary surface of the MVP.  Renders a full-bleed
 * Leaflet map with mock data baked in so the design and interaction
 * patterns can be iterated on without standing up the backend.
 *
 *  - On the left: a filter sheet (category chips, institution picker)
 *  - On the right: an FAB to /submit (rendered globally in layout)
 *
 * Data source policy (F3):
 *   - If the real NestJS API is configured (USE_API=true), we hit it via
 *     useNearbyProblems centered on Eger.  Errors fall through to an
 *     inline ErrorState card.
 *   - Otherwise the screen falls back to MOCK_PROBLEMS so the F2 demo
 *     still works without any env config.
 */
export function MapScreen() {
  const { session } = useAuth();

  const EGER = { latitude: 47.9025, longitude: 20.3772, radiusMeters: 4000 };

  const problemsQuery = useNearbyProblems(USE_API ? EGER : null, {
    refetchOnWindowFocus: false,
  });

  // Mock mode (or query not yet fired) → bake-in markers.
  const markers = USE_API && problemsQuery.data ? problemsQuery.data : MOCK_PROBLEMS;
  const isLoading = USE_API && problemsQuery.isLoading;
  const isError = USE_API && problemsQuery.isError;

  return (
    <div className="relative h-[calc(100vh-3.5rem)] w-full" data-testid="map-screen">
      <MapShell markers={markers} className="size-full" />

      <aside className="pointer-events-auto absolute left-4 top-4 z-[400] hidden max-w-xs rounded-lg border border-border bg-background/95 p-3 shadow-md backdrop-blur md:block">
        <h2 className="mb-2 text-sm font-semibold">Szűrők</h2>
        <p className="text-xs text-muted-foreground">
          A kategória- és intézményszűrő a következő iterációban kerül bekötésre —
          a mock adatokkal is látványos a térkép.
        </p>
        <div className="mt-3 flex justify-between gap-2">
          <Link href="/problems" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            Lista nézet
          </Link>
          <Link href="/submit" className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}>
            Új pin
          </Link>
        </div>
      </aside>

      {isError ? (
        <div className="pointer-events-none absolute inset-x-0 top-20 z-[401] mx-auto flex max-w-md justify-center px-4">
          <ErrorState
            severity="warning"
            variant="inline"
            title="Nem sikerült betölteni a bejelentéseket."
            description="A demo adatok jelennek meg helyette."
            className="pointer-events-auto bg-background"
          />
        </div>
      ) : null}

      {!isLoading && !isError && markers.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 z-[401] flex items-center justify-center">
          <EmptyState variant="no-pins" action={{ label: 'Bejelentés indítása', href: '/submit' }} className="pointer-events-auto bg-background" />
        </div>
      ) : null}

      {/* Diagnostic pill in dev so QA can see which mode is active. */}
      {process.env.NODE_ENV !== 'production' ? (
        <span
          className="pointer-events-none absolute bottom-3 left-3 z-[402] rounded-full border border-border bg-background/80 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground backdrop-blur"
          data-testid="map-mode-pill"
          data-mode={USE_API ? 'api' : 'mock'}
        >
          {USE_API ? `API · ${session?.user?.email ?? 'guest'}` : 'Mock dataset'}
        </span>
      ) : null}
    </div>
  );
}
