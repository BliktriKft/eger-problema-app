import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  PROBLEM_CATEGORY_LABELS_HU,
  PROBLEM_STATUS_LABELS_HU,
  type ProblemMarker,
} from '@/types';

export interface ProblemCardProps {
  problem: ProblemMarker;
  onPress?: () => void;
}

/**
 * List cell shown in the feed.  Compact — pulls in just the fields it needs
 * (`ProblemMarker`) so a single endpoint can power both the map and the feed
 * without a second refetch.
 */
export function ProblemCard({ problem, onPress }: ProblemCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${problem.title} — ${PROBLEM_CATEGORY_LABELS_HU[problem.category]}`}
      testID={`problem-card-${problem.id}`}
    >
      <View style={styles.row}>
        <Text style={styles.score} testID={`problem-score-${problem.id}`}>
          {problem.score > 0 ? `+${problem.score}` : problem.score}
        </Text>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {problem.title}
          </Text>
          <Text style={styles.meta}>
            {PROBLEM_CATEGORY_LABELS_HU[problem.category]} • {PROBLEM_STATUS_LABELS_HU[problem.status]}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardPressed: { opacity: 0.85 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  score: {
    minWidth: 44,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 18,
    color: '#0f172a',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 8,
  },
  body: { flex: 1, gap: 4 },
  title: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  meta: { fontSize: 12, color: '#64748b' },
});
