'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * MapPicker — client-only Leaflet wrapper used inside forms (e.g. the
 * InstitutionForm lat/lng editor).  Unlike MapView (which navigates to
 * /submit when the map is clicked), MapPicker fires an `onPick(latlng)`
 * callback so the parent form can keep the coordinates in its own state.
 *
 * Visual: single draggable marker at the current selection, click-to-move.
 */
const Inner = dynamic(() => import('./MapPickerClient').then((m) => m.MapPickerClient), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center bg-muted-100" data-testid="map-picker-loading">
      <Skeleton variant="rect" width="100%" height="100%" />
    </div>
  ),
});

export interface MapPickerProps {
  latitude: number;
  longitude: number;
  onPick: (latlng: { latitude: number; longitude: number }) => void;
  className?: string;
}

export function MapPicker({ latitude, longitude, onPick, className }: MapPickerProps) {
  return (
    <div data-testid="map-picker" className={className}>
      <Inner latitude={latitude} longitude={longitude} onPick={onPick} />
    </div>
  );
}