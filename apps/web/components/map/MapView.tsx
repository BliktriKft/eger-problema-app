'use client';

import * as React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRouter } from 'next/navigation';
import type { ProblemMarker, Problem } from '@/types';

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  markers: ReadonlyArray<ProblemMarker | (Problem & { id: string })>;
  /** When set, clicking the map (not a pin) opens the submit form with
   *  the new pin pre-located at the clicked (lat, lng). */
  onMapClickForNewPin?: boolean;
  selectedId?: string | null;
  className?: string;
}

/**
 * OSMap-backed Leaflet map.  The container renders on the client only
 * (Leaflet touches `window` at import time — we dynamic-import in
 * `MapViewClient` to keep the Server Component contract intact).
 *
 * We disable Leaflet's bundled default markers (which fail to load with
 * Next.js bundling) by registering our own `divIcon` HTML on every
 * `<Marker>` through a wrapped component below.
 */
export function MapView(props: MapViewProps) {
  return <MapViewClient {...props} />;
}

function MapViewClient({ center = EGER_CENTER, zoom = 13, markers, onMapClickForNewPin, selectedId, className }: MapViewProps) {
  const router = useRouter();

  return (
    <div className={className} data-testid="map-view" data-marker-count={markers.length}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="size-full" attributionControl>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {onMapClickForNewPin ? <ClickToAddLayer /> : null}
        {markers.map((m) => {
          const isSelected = selectedId === m.id;
          const icon = buildPinIcon({ type: derivePinType(m), state: isSelected ? 'selected' : 'default' });
          return (
            <Marker
              key={m.id}
              position={[m.latitude, m.longitude]}
              icon={icon}
              eventHandlers={{ click: () => router.push(`/problems/${m.id}`) }}
            >
              <Popup>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{m.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.score > 0 ? `+${m.score}` : m.score} szavazat
                  </p>
                  <a
                    href={`/problems/${m.id}`}
                    className="inline-block text-xs text-secondary underline-offset-4 hover:underline"
                  >
                    Részletek →
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

const EGER_CENTER: [number, number] = [47.9025, 20.3772];

function ClickToAddLayer() {
  const router = useRouter();
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      router.push(`/submit?lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}`);
    },
  });
  return null;
}

/**
 * The shared pin component lives in `design/map/pins.tsx`. To keep the
 * Next.js bundle boundary simple we render the same geometry here as an
 * inline SVG wrapped in a Leaflet `divIcon`. Colors follow
 * `design/components/map-marker.md`.
 */
function buildPinIcon(opts: { type: PinType; state: PinState }) {
  // We just use the colors documented in design/components/map-marker.md
  // and emit a small inline SVG that visually matches the design-system
  // pin.  Keeping the SVG inline is intentional — it sidesteps the
  // shared-component bundling issue where the Next.js client/server
  // bundle boundary mishandles a sibling TSX import.
  const { fill, stroke, ring } = PIN_COLORS[opts.type];
  const ringSvg = ring
    ? `<circle cx="16" cy="16" r="13.5" fill="none" stroke="${ring}" stroke-width="3" />`
    : '';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40" fill="none" aria-hidden>
      ${ringSvg}
      <path d="M16 40 L8 24 L24 24 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M16 2 C8.27 2 2 8.27 2 16 C2 24 16 24 16 24 C16 24 30 24 30 16 C30 8.27 23.73 2 16 2 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>
    </svg>`;
  return L.divIcon({
    className: `eger-pin`,
    html: `<div data-state="${opts.state}">${svg}</div>`,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36],
  });
}

type PinType = 'default' | 'school' | 'hospital' | 'pool' | 'library' | 'government' | 'other';
type PinState = 'default' | 'hover' | 'voted' | 'own' | 'moderated' | 'anonymous' | 'selected';

const PIN_COLORS: Record<PinType, { fill: string; stroke: string; ring?: string }> = {
  default:    { fill: '#374151', stroke: '#111827' },
  school:     { fill: '#F59E0B', stroke: '#92400E' },
  hospital:   { fill: '#DC2626', stroke: '#7F1D1D' },
  pool:       { fill: '#5373D3', stroke: '#112352' },
  library:    { fill: '#92400E', stroke: '#451A03' },
  government: { fill: '#1E3A8A', stroke: '#060C1B' },
  other:      { fill: '#6B7280', stroke: '#1F2937' },
};

function derivePinType(_m: ProblemMarker | Problem): PinType {
  // The ProblemMarker payload is lean — no institution type.  We fall
  // back to `default` so the layout still works; future ticket will
  // resolve the full Institution type from the Problem detail endpoint.
  return 'default';
}
