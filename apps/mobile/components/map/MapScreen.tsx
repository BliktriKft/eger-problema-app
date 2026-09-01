import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, UrlTile, type Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { ProblemPin } from './ProblemPin';

// Eger belváros — fallback ha a felhasználó nem ad location permissiont.
// Forrás: Google Maps coord (~47.9025, 20.3772).
const EGER_FALLBACK = { latitude: 47.9025, longitude: 20.3772 } as const;
const EGER_DELTA = { latitudeDelta: 0.04, longitudeDelta: 0.04 } as const;

import type { ProblemMarker as ProblemMarkerType } from '@/types';

export interface MapScreenProps {
  /** Optional pre-loaded markers — if omitted, the screen renders the empty OSMap. */
  initialProblems?: ReadonlyArray<ProblemMarkerType>;
  /** Called when the user taps a marker; pass through to navigation. */
  onMarkerPress?: (problemId: string) => void;
}

/**
 * OSMap-backed map view.
 *
 * OSMap renders via `UrlTile` overlay — Google/Apple's own tile layer is
 * disabled (`provider={null}`) so we never hit their billing APIs and we
 * comply with OSMap's Tile Usage Policy (attribution + sane UA).
 *
 * Note: the tile servers require a meaningful `User-Agent` on iOS/Android.
 * Expo's default fetch UA is `okhttp/<x.y.z>` which OSMap accepts; if we ever
 * see empty tiles it means OSMap is rate-limiting us — back off, do NOT pile
 * on more `<UrlTile>` instances per marker.
 */
export function MapScreen({ initialProblems = [], onMarkerPress }: MapScreenProps) {
  const [region, setRegion] = useState<Region>({
    ...EGER_FALLBACK,
    ...EGER_DELTA,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        // Request only if we haven't been asked before — re-prompting after
        // denial is hostile UX.
        if (status === 'undetermined') {
          await Location.requestForegroundPermissionsAsync();
        }
        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) return;

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        setRegion({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          ...EGER_DELTA,
        });
      } catch (err) {
        // Don't block the map — just fall back to Eger centre.  Log so dev
        // can tell why the GPS didn't engage.
        console.warn('[map] location unavailable', err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Ismeretlen helymeghatározási hiba');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.container} testID="map-screen">
      <MapView
        style={styles.map}
        // `provider={null}` disables the bundled Google/Apple tile layer so
        // OSMap's UrlTile can render without paying Google/Apple for tiles.
        // The TS type doesn't permit `null` (it only models the two SDK
        // providers), so we cast — runtime is fine.
        provider={null as unknown as undefined}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton
        mapType="none"
        loadingEnabled
        loadingBackgroundColor="#0f172a"
        loadingIndicatorColor="#38bdf8"
      >
        {/* OSMap overlay — {s} rotates between a.tile, b.tile, c.tile for load balancing. */}
        <UrlTile
          urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />
        {initialProblems.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            anchor={{ x: 0.5, y: 1 }}
            onPress={() => onMarkerPress?.(p.id)}
            testID={`problem-pin-${p.id}`}
          >
            <ProblemPin score={p.score} category={p.category} status={p.status} />
          </Marker>
        ))}
      </MapView>

      {error ? (
        <View style={styles.errorBanner} pointerEvents="none">
          <Text style={styles.errorText}>📍 Helyadat nem elérhető — Eger középpontját mutatjuk.</Text>
        </View>
      ) : null}

      {/* Lightweight "loading…" overlay while the tile cache warms.  Once
          react-native-maps fires `onMapReady` we drop this — until then, the
          OSM tiles can flash grey on slow networks. */}
      <View style={styles.loadingHint} pointerEvents="none">
        <ActivityIndicator size="small" color="#38bdf8" />
        <Text style={styles.loadingText}> OSMap betöltése…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  map: { flex: 1 },
  errorBanner: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    padding: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 8,
  },
  errorText: { color: '#f97316', fontSize: 12 },
  loadingHint: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 999,
  },
  loadingText: { color: '#e2e8f0', fontSize: 12 },
});
