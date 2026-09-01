import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  PROBLEM_CATEGORY_LABELS_HU,
  PROBLEM_STATUS_LABELS_HU,
  type Problem,
} from '@/types';
import { VoteButtons } from '@/components/voting/VoteButtons';

const SAMPLE_PROBLEMS: Readonly<Record<string, Problem>> = {
  'sample-1': {
    id: 'sample-1',
    title: 'Kátyú a Kossuth utcán',
    description:
      'A Kossuth utca 12. előtt már több mint két hete nagy kátyú van, ami balesetveszélyes.',
    latitude: 47.9031,
    longitude: 20.3766,
    category: 'infrastructure',
    status: 'open',
    institutionId: null,
    createdBy: 'sample-user',
    createdAt: '2026-08-29T10:00:00Z',
    score: 7,
  },
  'sample-2': {
    id: 'sample-2',
    title: 'Nem működik a közvilágítás',
    description:
      'A Maklári út északi szakaszán 4 lámpaoszlop nem világít, a gyalogos átkelő sötétben van.',
    latitude: 47.8998,
    longitude: 20.3790,
    category: 'infrastructure',
    status: 'investigating',
    institutionId: 'inst-1',
    createdBy: 'sample-user',
    createdAt: '2026-08-25T18:00:00Z',
    score: 3,
  },
  'sample-3': {
    id: 'sample-3',
    title: 'Szemét az Eger-patak partján',
    description: 'A patak északi oldalán nagy szemétkupac alakult ki a padok mögött.',
    latitude: 47.9055,
    longitude: 20.3740,
    category: 'environment',
    status: 'open',
    institutionId: null,
    createdBy: 'sample-user',
    createdAt: '2026-08-30T08:00:00Z',
    score: 5,
  },
  'sample-4': {
    id: 'sample-4',
    title: 'Veszélyes gólyafészek',
    description: 'A korábbi bejelentést a szolgáltató 48 órán belül megoldotta.',
    latitude: 47.8990,
    longitude: 20.3715,
    category: 'public_safety',
    status: 'resolved',
    institutionId: 'inst-2',
    createdBy: 'sample-user',
    createdAt: '2026-08-15T10:00:00Z',
    score: 12,
  },
};

export default function ProblemDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const problem = id ? SAMPLE_PROBLEMS[id] : undefined;

  if (!problem) {
    return (
      <View style={styles.empty} testID="problem-missing">
        <Text style={styles.emptyText}>Ilyen azonosítójú probléma nem található.</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backLabel}>Vissza</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={styles.headerRow}>
        <View style={styles.metaCol}>
          <Text style={styles.category}>{PROBLEM_CATEGORY_LABELS_HU[problem.category]}</Text>
          <Text style={styles.status}>{PROBLEM_STATUS_LABELS_HU[problem.status]}</Text>
        </View>
        <VoteButtons
          score={problem.score}
          onVote={() => undefined /* M2: POST /votes */}
        />
      </View>

      <Text style={styles.title} testID="problem-title">
        {problem.title}
      </Text>
      <Text style={styles.description}>{problem.description}</Text>

      <View style={styles.locationCard}>
        <Text style={styles.locationLabel}>Hely</Text>
        <Text style={styles.locationValue}>
          {problem.latitude.toFixed(5)}, {problem.longitude.toFixed(5)}
        </Text>
      </View>

      <Text style={styles.note}>
        M1 — minta adatok. A részletek képernyő valódi bekötése a Task M2-ben.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { padding: 16, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaCol: { gap: 4 },
  category: { color: '#38bdf8', fontSize: 12, fontWeight: '600' },
  status: { color: '#fbbf24', fontSize: 12 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 8 },
  description: { color: '#cbd5e1', fontSize: 14, lineHeight: 20 },
  locationCard: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 10,
    gap: 4,
  },
  locationLabel: { color: '#94a3b8', fontSize: 12 },
  locationValue: { color: '#e2e8f0', fontSize: 14, fontFamily: 'monospace' },
  note: { color: '#64748b', fontSize: 11, fontStyle: 'italic', marginTop: 8 },
  empty: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    gap: 16,
  },
  emptyText: { color: '#f8fafc', fontSize: 14, textAlign: 'center' },
  backBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backLabel: { color: '#e2e8f0', fontWeight: '600' },
});
