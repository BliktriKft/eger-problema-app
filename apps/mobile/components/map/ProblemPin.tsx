import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PROBLEM_CATEGORY_LABELS_HU, PROBLEM_STATUS_LABELS_HU, type ProblemCategory, type ProblemStatus } from '@/types';

export interface ProblemPinProps {
  /** Aggregated score (upvotes − downvotes). 0 ⇒ neutral grey. */
  score: number;
  category: ProblemCategory;
  status: ProblemStatus;
}

/**
 * Custom marker view used inside <Marker />.  Kept tiny (≤48dp) so we don't
 * tank the OSM tile render perf on dense clusters.
 *
 * Colour rules:
 *   - red    → open + high score
 *   - amber  → open + low score OR in-progress
 *   - slate  → resolved
 *   - blue   → assigned to an institution (status === "assigned")
 */
export function ProblemPin({ score, category, status }: ProblemPinProps) {
  const bg = colorForStatusAndScore(status, score);
  const label = PROBLEM_CATEGORY_LABELS_HU[category];

  return (
    <View style={[styles.pin, { backgroundColor: bg }]} testID="problem-pin">
      <Text style={styles.score} numberOfLines={1}>
        {score > 0 ? `+${score}` : score}
      </Text>
      <Text style={styles.category} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.status} numberOfLines={1}>
        {PROBLEM_STATUS_LABELS_HU[status]}
      </Text>
    </View>
  );
}

function colorForStatusAndScore(status: ProblemStatus, score: number): string {
  if (status === 'resolved') return '#475569'; // slate
  if (status === 'investigating') return '#f97316'; // amber-500
  // open / closed
  return score >= 5 ? '#dc2626' : score >= 1 ? '#f59e0b' : '#64748b';
}

const styles = StyleSheet.create({
  pin: {
    minWidth: 56,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  score: { color: '#fff', fontWeight: '700', fontSize: 14 },
  category: { color: '#fff', fontSize: 9, opacity: 0.95 },
  status: { color: '#fff', fontSize: 8, opacity: 0.85 },
});
