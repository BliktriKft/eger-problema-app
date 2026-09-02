// apps/mobile/components/submit/LocationPicker.tsx
//
// Map-anchored location picker.  Renders an OSMap (UrlTile overlay) with
// a draggable centre pin.  The user can also tap the "📍 Jelenlegi hely"
// button to snap the picker to their GPS position via expo-location.
//
// Exposes the resolved coordinates through `onChange` so the submit form
// can pipe them straight into react-hook-form via a hidden Controller.

import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, UrlTile, type Region } from 'react-native-maps';
import * as Location from 'expo-location';

const EGER_FALLBACK = { latitude: 47.9025, longitude: 20.3772 } as const;
const EGER_DELTA = { latitudeDelta: 0.01, longitudeDelta: 0.01 } as const;

export interface LocationPickerValue {
  latitude: number;
  longitude: number;
}

export interface LocationPickerProps {
  value: LocationPickerValue | null;
  onChange: (next: LocationPickerValue) => void;
  /** Height of the map area in pixels (default 240). */
  height?: number;
}

export function LocationPicker({ value, onChange, height = 240 }: LocationPickerProps) {
  const initial = value ?? EGER_FALLBACK;
  const mapRef = useRef<MapView | null>(null);
  const [region, setRegion] = useState<Region>({ ...initial, ...EGER_DELTA });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // If the parent clears the value (or first mount with null), keep the
    // region centred on Eger so the user sees *something* on load.
    if (!value) {
      setRegion({ ...EGER_FALLBACK, ...EGER_DELTA });
    } else {
      setRegion({ ...value, ...EGER_DELTA });
    }
  }, [value?.latitude, value?.longitude]); // eslint-disable-line react-hooks/exhaustive-deps

  async function useGps() {
    setBusy(true);
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'undetermined') {
        await Location.requestForegroundPermissionsAsync();
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const next: LocationPickerValue = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      onChange(next);
      mapRef.current?.animateToRegion({ ...next, ...EGER_DELTA });
    } catch (err) {
      console.warn('[location-picker] gps failed', err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.wrap, { height }]} testID="location-picker">
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={null as unknown as undefined}
        initialRegion={region}
        onRegionChangeComplete={(r) => setRegion(r)}
        onPress={(e) => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          onChange({ latitude, longitude });
        }}
        showsUserLocation
        showsMyLocationButton={false}
        mapType="none"
      >
        <UrlTile urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} flipY={false} />
        {value ? (
          <Marker
            coordinate={value}
            anchor={{ x: 0.5, y: 1 }}
            draggable
            onDragEnd={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              onChange({ latitude, longitude });
            }}
            testID="location-picker-marker"
          />
        ) : null}
      </MapView>

      <View style={styles.controls} pointerEvents="box-none">
        <Pressable
          onPress={useGps}
          disabled={busy}
          style={[styles.btn, busy && styles.btnBusy]}
          testID="location-picker-gps"
        >
          {busy ? (
            <ActivityIndicator color="#0f172a" />
          ) : (
            <Text style={styles.btnLabel}>📍 Jelenlegi hely</Text>
          )}
        </Pressable>
        {value ? (
          <Text style={styles.coords} testID="location-picker-coords">
            {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#0f172a',
  },
  map: { flex: 1 },
  controls: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  btn: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnBusy: { opacity: 0.6 },
  btnLabel: { color: '#0f172a', fontWeight: '700', fontSize: 12 },
  coords: {
    color: '#fff',
    fontSize: 11,
    backgroundColor: 'rgba(15,23,42,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
});
