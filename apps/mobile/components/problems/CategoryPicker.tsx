// apps/mobile/components/problems/CategoryPicker.tsx
//
// Horizontal pill picker for the six ProblemCategory values.  Reused by
// both the submit form and the feed list filter — keeps the chip styling
// consistent and avoids prop-drilling the labels object.

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { PROBLEM_CATEGORIES, PROBLEM_CATEGORY_LABELS_HU, type ProblemCategory } from '@/types';

export interface CategoryPickerProps {
  value: ProblemCategory | null;
  onChange: (next: ProblemCategory | null) => void;
  /** When true, a leading "Összes" pill is shown so users can clear the filter. */
  showAll?: boolean;
  /** Optional testID prefix for Detox. */
  testIDPrefix?: string;
  /** Single-line label rendered above the row (e.g. "Szűrés kategória szerint"). */
  label?: string;
}

/**
 * Horizontal scrollable picker.  Wrap in a fixed-height container from
 * the caller when you need it to feel "anchored" (vs. scrollable).
 */
export function CategoryPicker({
  value,
  onChange,
  showAll = false,
  testIDPrefix = 'category',
  label,
}: CategoryPickerProps) {
  function isActive(cat: ProblemCategory | null): boolean {
    return value === cat;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      testID={`${testIDPrefix}-picker`}
    >
      {label ? <Text style={styles.label}>{label}</Text> : null}

      {showAll ? (
        <Pressable
          onPress={() => onChange(null)}
          style={[styles.chip, isActive(null) && styles.chipActive]}
          testID={`${testIDPrefix}-all`}
        >
          <Text style={[styles.label, isActive(null) && styles.labelActive]}>Összes</Text>
        </Pressable>
      ) : null}

      {PROBLEM_CATEGORIES.map((cat) => (
        <Pressable
          key={cat}
          onPress={() => onChange(cat)}
          style={[styles.chip, isActive(cat) && styles.chipActive]}
          testID={`${testIDPrefix}-${cat}`}
        >
          <Text style={[styles.label, isActive(cat) && styles.labelActive]}>
            {PROBLEM_CATEGORY_LABELS_HU[cat]}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  label: { color: '#0f172a', fontSize: 12, fontWeight: '600' },
  labelActive: { color: '#fff' },
});
