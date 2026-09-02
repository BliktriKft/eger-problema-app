// apps/mobile/app/(tabs)/feed.tsx
//
// "Lista" tab.  Renders the nearby problems feed via `useNearbyProblems`.
// Pull-to-refresh, category filter, and a friendly empty/error state.
//
// We anchor the "nearby" query on Eger centre when the user hasn't
// granted location permission — the OSMap tab owns the GPS bootstrap,
// so by the time the user lands here we either have a position or the
// `RegionContext` fallback.

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ProblemCard } from '@/components/problems/ProblemCard';
import { CategoryPicker } from '@/components/problems/CategoryPicker';
import { useNearbyProblems } from '@/lib/api/queries/problems';
import { DEFAULT_NEARBY_RADIUS_M } from '@/types';
import type { ProblemCategory, ProblemMarker } from '@/types';

const EGER_CENTRE = { latitude: 47.9025, longitude: 20.3772 } as const;

export default function FeedRoute() {
  const router = useRouter();
  const [category, setCategory] = useState<ProblemCategory | null>(null);

  const query = useNearbyProblems({
    latitude: EGER_CENTRE.latitude,
    longitude: EGER_CENTRE.longitude,
    radiusMeters: DEFAULT_NEARBY_RADIUS_M,
    ...(category ? { category } : {}),
  });

  const onRefresh = useCallback(() => {
    query.refetch();
  }, [query]);

  const renderItem = useCallback(
    ({ item }: { item: ProblemMarker }) => (
      <ProblemCard
        problem={item}
        onPress={() => router.push({ pathname: '/problem/[id]', params: { id: item.id } })}
      />
    ),
    [router],
  );

  const header = useMemo(
    () => (
      <View style={styles.headerWrap}>
        <Text style={styles.title}>Bejelentések</Text>
        <Text style={styles.subtitle}>
          {query.data
            ? `${query.data.length} db probléma Eger belvárosában`
            : 'Betöltés…'}
        </Text>
        <CategoryPicker
          value={category}
          onChange={setCategory}
          showAll
          testIDPrefix="feed-filter"
        />
      </View>
    ),
    [query.data, category],
  );

  return (
    <View style={styles.container} testID="feed-screen">
      <FlatList
        data={query.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={
          query.isLoading ? (
            <View style={styles.empty}>
              <ActivityIndicator color="#38bdf8" />
            </View>
          ) : query.error ? (
            <View style={styles.empty}>
              <Text style={styles.errorTitle}>Nem sikerült betölteni a bejelentéseket.</Text>
              <Text style={styles.errorBody}>Húzd lefelé az újrapróbálkozáshoz.</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.muted}>Nincs a szűrésnek megfelelő bejelentés.</Text>
              {category ? (
                <Pressable
                  onPress={() => setCategory(null)}
                  style={styles.cta}
                  testID="feed-clear-filter"
                >
                  <Text style={styles.ctaLabel}>Szűrés törlése</Text>
                </Pressable>
              ) : null}
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={query.isFetching && !query.isLoading}
            onRefresh={onRefresh}
            tintColor="#0f172a"
            colors={['#0f172a']}
          />
        }
        contentContainerStyle={query.data?.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  headerWrap: { paddingTop: 8, paddingBottom: 4, backgroundColor: '#f1f5f9' },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a', paddingHorizontal: 16 },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 4, paddingHorizontal: 16 },
  empty: { padding: 48, alignItems: 'center', gap: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  muted: { color: '#64748b', fontSize: 14 },
  errorTitle: { color: '#dc2626', fontWeight: '600', fontSize: 14, textAlign: 'center' },
  errorBody: { color: '#64748b', fontSize: 12, textAlign: 'center' },
  cta: {
    marginTop: 8,
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  ctaLabel: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
