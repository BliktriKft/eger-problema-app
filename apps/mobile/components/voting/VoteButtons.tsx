// apps/mobile/components/voting/VoteButtons.tsx
//
// Upvote/downvote widget backed by `useVote(problemId)`.  Implements the
// same optimistic-update + rollback flow as the web app, so tapping a
// vote feels instant even on a flaky mobile network.
//
// Requires the user to be signed in (the `useVote` hook throws ApiError(401)
// and the parent should catch and prompt login).  We render the buttons
// as disabled while the mutation is in flight to avoid double-fires.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useVote } from '@/lib/api/queries/problems';

export interface VoteButtonsProps {
  problemId: string;
  /** Current aggregated score. */
  score: number;
  /** External "in-flight" flag so callers can show a spinner around the buttons. */
  isPending?: boolean;
  /** Called when the user taps a vote but is not authenticated. */
  onAuthRequired?: () => void;
}

/**
 * The `myVote` (up / down / null) state is intentionally NOT persisted —
 * the server is authoritative on what the current user voted.  We just
 * show the buttons and let the optimistic update flow be visible.
 */
export function VoteButtons({ problemId, score, isPending, onAuthRequired }: VoteButtonsProps) {
  const vote = useVote(problemId);

  function handle(direction: 'up' | 'down') {
    if (vote.isPending) return;
    const value: 1 | -1 = direction === 'up' ? 1 : -1;
    vote.mutate(value, {
      onError: (err) => {
        // 401 → user must log in.  The hook throws ApiError with status 401.
        const status = err && typeof err === 'object' && 'status' in err
          ? (err as { status?: number }).status
          : undefined;
        if (status === 401) onAuthRequired?.();
      },
    });
  }

  const pending = isPending || vote.isPending;

  return (
    <View style={styles.row} testID="vote-buttons">
      <Pressable
        onPress={() => handle('up')}
        disabled={pending}
        style={[styles.btn, pending && styles.btnPending]}
        accessibilityRole="button"
        accessibilityLabel="Upvote"
        testID="vote-up"
      >
        <Text style={styles.arrow}>▲</Text>
      </Pressable>
      <Text style={styles.score} testID="vote-score">
        {score > 0 ? `+${score}` : score}
      </Text>
      <Pressable
        onPress={() => handle('down')}
        disabled={pending}
        style={[styles.btn, pending && styles.btnPending]}
        accessibilityRole="button"
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
  btnPending: { opacity: 0.6 },
  arrow: { fontSize: 16, color: '#0f172a' },
  score: { minWidth: 36, textAlign: 'center', fontWeight: '700', fontSize: 16, color: '#0f172a' },
});
