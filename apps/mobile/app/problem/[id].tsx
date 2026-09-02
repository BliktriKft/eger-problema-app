// apps/mobile/app/problem/[id].tsx
//
// Modal detail page for a single problem.  Pulls the Problem + the
// matching wiki entry via TanStack Query (`useProblem` + `useWiki`).
// Renders the `ProblemDetail` component with optimistic-vote enabled
// via the `VoteButtons` child.

import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useProblem, useWiki } from '@/lib/api/queries/problems';
import { ProblemDetail } from '@/components/problems/ProblemDetail';

export default function ProblemDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const problem = useProblem(id);
  const wiki = useWiki(id);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/map');
  }, [router]);

  if (problem.isLoading) {
    return (
      <View style={styles.center} testID="problem-loading">
        <ActivityIndicator color="#38bdf8" />
      </View>
    );
  }

  if (problem.error || !problem.data) {
    return (
      <View style={styles.center} testID="problem-missing">
        <Text style={styles.muted}>
          A probléma betöltése nem sikerült, vagy nem létezik.
        </Text>
        <Pressable onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backLabel}>Vissza</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <ProblemDetail problem={problem.data} wiki={wiki} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { padding: 16, gap: 12 },
  center: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    gap: 16,
  },
  muted: { color: '#f8fafc', fontSize: 14, textAlign: 'center' },
  backBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backLabel: { color: '#e2e8f0', fontWeight: '600' },
});
