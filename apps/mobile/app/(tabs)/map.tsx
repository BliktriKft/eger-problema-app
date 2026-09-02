// apps/mobile/app/(tabs)/map.tsx
//
// "Térkép" tab.  Renders the OSMap overlay with markers sourced from
// `useNearbyProblems`.  When the user taps a pin, we push the
// `/problem/[id]` modal with the marker's id — the detail screen owns
// fetching the full record.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MapScreen } from '@/components/map/MapScreen';
import { useNearbyProblems } from '@/lib/api/queries/problems';
import { DEFAULT_NEARBY_RADIUS_M } from '@/types';

const EGER_CENTRE = { latitude: 47.9025, longitude: 20.3772 } as const;

export default function MapRoute() {
  const router = useRouter();
  const query = useNearbyProblems({
    latitude: EGER_CENTRE.latitude,
    longitude: EGER_CENTRE.longitude,
    radiusMeters: DEFAULT_NEARBY_RADIUS_M,
  });

  return (
    <View style={styles.container} testID="map-tab">
      <MapScreen
        initialProblems={query.data ?? []}
        onMarkerPress={(id) => router.push({ pathname: '/problem/[id]', params: { id } })}
      />
      {!query.isLoading && (query.data?.length ?? 0) === 0 ? (
        <View style={styles.banner} pointerEvents="none">
          <Text style={styles.bannerText}>
            {query.error
              ? '📍 A problémák betöltése nem sikerült — húzd lefelé a frissítéshez.'
              : 'Még nincs megjeleníthető bejelentés a közelben.'}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  banner: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    padding: 10,
    borderRadius: 8,
  },
  bannerText: { color: '#e2e8f0', fontSize: 12 },
});
