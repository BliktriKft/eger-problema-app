'use client';

import dynamic from 'next/dynamic';
import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProblemMarker, Problem } from '@/types';

/**
 * Client-only Leaflet wrapper.  We split it out of `MapView.tsx` so the
 * rest of the page can stay as a Server Component — Leaflet
 * `L.Icon.Default` etc. reach for `window` at import time and crash
 * server-side rendering without a dynamic import.
 */
const Inner = dynamic(() => import('./MapView').then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center bg-muted-100" data-testid="map-loading">
      <div className="flex flex-col items-center gap-3">
        <Skeleton variant="rect" width={260} height={20} className="rounded-full" />
        <Skeleton variant="rect" width={180} height={20} className="rounded-full" />
      </div>
    </div>
  ),
});

export interface MapShellProps {
  markers: ReadonlyArray<ProblemMarker | (Problem & { id: string })>;
  center?: [number, number];
  zoom?: number;
  onMapClickForNewPin?: boolean;
  selectedId?: string | null;
  className?: string;
}

export function MapShell(props: MapShellProps) {
  return (
    <div data-testid="map-shell" className={props.className}>
      <Inner {...props} />
    </div>
  );
}
