import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ProblemCard } from '@/components/problems/ProblemCard';
import { ProblemMarker } from '@/types';

// Same sample data as the map for visual coherence in the M1 demo.
const SAMPLE_FEED: ReadonlyArray<ProblemMarker> = [
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
];

export default function FeedRoute() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <FlatList
        data={SAMPLE_FEED as ProblemMarker[]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProblemCard
            problem={item}
            onPress={() => router.push({ pathname: '/problem/[id]', params: { id: item.id } })}
          />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Bejelentések</Text>
            <Text style={styles.subtitle}>
              M1 — minta lista. Az éles feed a Task M2-ben (TanStack Query + `GET /problems`).
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Hamarosan…</Text>
          </View>
        }
        contentContainerStyle={SAMPLE_FEED.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 4 },
  empty: { padding: 48, alignItems: 'center' },
  emptyText: { color: '#64748b', fontSize: 14 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
});
