'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MapShell } from '@/components/map/MapShell';
import { useAuth } from '@/lib/auth-context';
import { listNearbyProblems } from '@/lib/api';
import { MOCK_PROBLEMS } from '@/lib/mock-problems';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/cn';

/**
 * MapScreen — the primary surface of the MVP.  Renders a full-bleed
 * Leaflet map with mock data baked in so the design and interaction
 * patterns can be iterated on without standing up the backend.
 *
 *  - On the left: a filter sheet (category chips, institution picker)
 *  - On the right: an FAB to /submit (rendered globally in layout)
 *
 * When Supabase is configured the map pulls from /api/problems/nearby
 * centered on Eger.  Otherwise it falls back to the mock dataset.
 */
export function MapScreen() {
  const { isConfigured, session } = useAuth();

  const EGER = { latitude: 47.9025, longitude: 20.3772 };

  const problemsQuery = useQuery({
    queryKey: ['problems', 'nearby', EGER],
    queryFn: () => listNearbyProblems({ ...EGER, radiusMeters: 4000 }, session?.access_token ?? null),
    enabled: isConfigured,
    staleTime: 30_000,
  });

  const markers = isConfigured && problemsQuery.data ? problemsQuery.data : MOCK_PROBLEMS;
  const isLoading = isConfigured && problemsQuery.isLoading;

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

      {isLoading ? null : markers.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 z-[401] flex items-center justify-center">
          <EmptyState variant="no-pins" action={{ label: 'Bejelentés indítása', href: '/submit' }} className="pointer-events-auto bg-background" />
        </div>
      ) : null}
    </div>
  );
}
