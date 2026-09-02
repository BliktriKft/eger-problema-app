// apps/mobile/components/problems/ProblemDetail.tsx
//
// Full detail layout: header (category/status badges + vote buttons),
// title, description, location card, and the AI-generated wiki section
// (fetched via `useWiki`).  Pure presentational component — the route
// file (`app/problem/[id].tsx`) owns data fetching and navigation.

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { Problem } from '@/types';
import { PROBLEM_CATEGORY_LABELS_HU, PROBLEM_STATUS_LABELS_HU } from '@/types';
import { VoteButtons } from '@/components/voting/VoteButtons';
import type { WikiEntry } from '@/types';

export interface ProblemDetailProps {
  problem: Problem;
  wiki: { data: WikiEntry | null | undefined; isLoading: boolean; error: unknown };
}

export function ProblemDetail({ problem, wiki }: ProblemDetailProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.metaCol}>
          <Text style={styles.category} testID="problem-category">
            {PROBLEM_CATEGORY_LABELS_HU[problem.category]}
          </Text>
          <Text style={styles.status} testID="problem-status">
            {PROBLEM_STATUS_LABELS_HU[problem.status]}
          </Text>
        </View>
        <VoteButtons problemId={problem.id} score={problem.score} />
      </View>

      <Text style={styles.title} testID="problem-title">
        {problem.title}
      </Text>
      <Text style={styles.description} testID="problem-description">
        {problem.description}
      </Text>

      {problem.institutionName ? (
        <View style={styles.institutionCard}>
          <Text style={styles.institutionLabel}>Érintett intézmény</Text>
          <Text style={styles.institutionValue}>{problem.institutionName}</Text>
        </View>
      ) : null}

      <View style={styles.locationCard}>
        <Text style={styles.locationLabel}>Hely</Text>
        <Text style={styles.locationValue} testID="problem-coords">
          {problem.latitude.toFixed(5)}, {problem.longitude.toFixed(5)}
        </Text>
      </View>

      <View style={styles.wikiSection} testID="wiki-section">
        <Text style={styles.wikiHeading}>📚 Háttér (AI-generált wiki)</Text>
        {wiki.isLoading ? (
          <View style={styles.wikiLoading}>
            <ActivityIndicator size="small" color="#38bdf8" />
            <Text style={styles.wikiMuted}> Háttér-információk betöltése…</Text>
          </View>
        ) : wiki.error ? (
          <Text style={styles.wikiError}>A háttér-szekció jelenleg nem elérhető.</Text>
        ) : wiki.data ? (
          <>
            <Text style={styles.wikiTitle}>{wiki.data.title}</Text>
            <Text style={styles.wikiBody}>{wiki.data.body}</Text>
            {wiki.data.sources?.length ? (
              <Text style={styles.wikiMuted}>
                Források: {wiki.data.sources.length} db • modell: {wiki.data.modelVersion}
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.wikiMuted} testID="wiki-empty">
            Ehhez a problémához még nincs háttér-információ. Az AI szolgáltatás automatikusan
            generálja, ha a bejelentés elég részletes.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaCol: { gap: 4 },
  category: { color: '#38bdf8', fontSize: 12, fontWeight: '600' },
  status: { color: '#fbbf24', fontSize: 12 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 8 },
  description: { color: '#cbd5e1', fontSize: 14, lineHeight: 20 },
  institutionCard: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 10,
    gap: 4,
  },
  institutionLabel: { color: '#94a3b8', fontSize: 12 },
  institutionValue: { color: '#e2e8f0', fontSize: 14, fontWeight: '600' },
  locationCard: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 10,
    gap: 4,
  },
  locationLabel: { color: '#94a3b8', fontSize: 12 },
  locationValue: { color: '#e2e8f0', fontSize: 14, fontFamily: 'monospace' },
  wikiSection: {
    backgroundColor: '#0b1226',
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    borderRadius: 10,
    gap: 6,
    marginTop: 4,
  },
  wikiHeading: { color: '#e2e8f0', fontWeight: '700', fontSize: 14 },
  wikiLoading: { flexDirection: 'row', alignItems: 'center' },
  wikiMuted: { color: '#94a3b8', fontSize: 12, fontStyle: 'italic' },
  wikiError: { color: '#f97316', fontSize: 12 },
  wikiTitle: { color: '#e2e8f0', fontSize: 13, fontWeight: '600' },
  wikiBody: { color: '#cbd5e1', fontSize: 13, lineHeight: 19 },
});
