'use client';

import * as React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const EGER_CENTER: [number, number] = [47.9025, 20.3772];

export interface MapPickerClientProps {
  latitude: number;
  longitude: number;
  onPick: (latlng: { latitude: number; longitude: number }) => void;
}

function PickHandler({ onPick }: { onPick: MapPickerClientProps['onPick'] }) {
  useMapEvents({
    click(e) {
      onPick({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
  });
  return null;
}

function makeIcon() {
  return L.divIcon({
    className: 'eger-pin',
    html: `<div data-state="picked"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40" fill="none" aria-hidden>
      <path d="M16 40 L8 24 L24 24 Z" fill="#1E3A8A" stroke="#060C1B" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M16 2 C8.27 2 2 8.27 2 16 C2 24 16 24 16 24 C16 24 30 24 30 16 C30 8.27 23.73 2 16 2 Z" fill="#1E3A8A" stroke="#060C1B" stroke-width="1.5" stroke-linejoin="round"/>
    </svg></div>`,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
  });
}

/**
 * Client-side implementation of MapPicker. Renders a single draggable
 * marker that follows the parent's latitude/longitude, and calls
 * `onPick` when the map is clicked.
 */
export function MapPickerClient({ latitude, longitude, onPick }: MapPickerClientProps) {
  const center: [number, number] = [latitude, longitude];
  return (
    <div className="size-full" data-testid="map-picker-client">
      <MapContainer center={center} zoom={14} scrollWheelZoom className="size-full" attributionControl>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <PickHandler onPick={onPick} />
        <Marker position={[latitude, longitude]} icon={makeIcon()} />
      </MapContainer>
    </div>
  );
}