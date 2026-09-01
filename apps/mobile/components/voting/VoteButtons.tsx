import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export interface VoteButtonsProps {
  /** Current aggregated score (for display next to the buttons). */
  score: number;
  /** Existing vote by the current user, if any. */
  myVote?: 'up' | 'down' | null;
  /** True while the vote mutation is in flight. */
  isPending?: boolean;
  onVote: (value: 'up' | 'down') => void;
}

/**
 * Disabled / wire-up only stub for M1.  The real optimistic update + RPC
 * lands in M2 once the backend's `POST /votes` endpoint is live and we've
 * matched a `problemId` prop on top.
 */
export function VoteButtons({ score, myVote, isPending, onVote }: VoteButtonsProps) {
  const [localVote, setLocalVote] = useState<'up' | 'down' | null>(myVote ?? null);

  return (
    <View style={styles.row} testID="vote-buttons">
      <Pressable
        onPress={() => {
          setLocalVote((cur) => (cur === 'up' ? null : 'up'));
          onVote('up');
        }}
        disabled={isPending}
        style={[styles.btn, localVote === 'up' && styles.btnUpActive]}
        accessibilityLabel="Upvote"
        testID="vote-up"
      >
        <Text style={styles.arrow}>▲</Text>
      </Pressable>
      <Text style={styles.score} testID="vote-score">
        {score}
      </Text>
      <Pressable
        onPress={() => {
          setLocalVote((cur) => (cur === 'down' ? null : 'down'));
          onVote('down');
        }}
        disabled={isPending}
        style={[styles.btn, localVote === 'down' && styles.btnDownActive]}
        accessibilityLabel="Downvote"
        testID="vote-down"
      >
        <Text style={styles.arrow}>▼</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  btnUpActive: { backgroundColor: '#16a34a', borderColor: '#15803d' },
  btnDownActive: { backgroundColor: '#dc2626', borderColor: '#b91c1c' },
  arrow: { fontSize: 16, color: '#0f172a' },
  score: { minWidth: 36, textAlign: 'center', fontWeight: '700', fontSize: 16, color: '#0f172a' },
});
