import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { ProblemMarker } from '@/types';
import { MapScreen } from '@/components/map/MapScreen';

// Hard-coded marker set for the M1 stub — replaced by a TanStack Query against
// `/problems/nearby` once the API endpoint is wired in M2.
const SAMPLE_MARKERS: ReadonlyArray<ProblemMarker> = [
  {
    id: 'sample-1',
    title: 'Kátyú a Kossuth utcán',
    category: 'infrastructure',
    status: 'open',
    latitude: 47.9031,
    longitude: 20.3766,
    score: 7,
  },
  {
    id: 'sample-2',
    title: 'Nem működik a közvilágítás',
    category: 'infrastructure',
    status: 'investigating',
    latitude: 47.8998,
    longitude: 20.3790,
    score: 3,
  },
  {
    id: 'sample-3',
    title: 'Szemét az Eger-patak partján',
    category: 'environment',
    status: 'open',
    latitude: 47.9055,
    longitude: 20.3740,
    score: 5,
  },
  {
    id: 'sample-4',
    title: 'Veszélyes gólyafészek (már megoldva)',
    category: 'public_safety',
    status: 'resolved',
    latitude: 47.8990,
    longitude: 20.3715,
    score: 12,
  },
];

export default function MapRoute() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <MapScreen
        initialProblems={SAMPLE_MARKERS}
        onMarkerPress={(id) => router.push({ pathname: '/problem/[id]', params: { id } })}
      />
      <View style={styles.legend} pointerEvents="none">
        <Text style={styles.legendTitle}>M1 — Térkép (OSMap)</Text>
        <Text style={styles.legendBody}>
          OSMap csempe overlay react-native-maps-szel ({`provider={null}`}). A pin-ek
          minta-adatok, a valódi feed a Task M2-ben jön.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  legend: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    padding: 10,
    borderRadius: 8,
  },
  legendTitle: { color: '#e2e8f0', fontWeight: '700', fontSize: 12 },
  legendBody: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
});
