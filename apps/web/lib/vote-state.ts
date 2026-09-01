import type { Problem } from '@/types';

export type VoteState = 'neutral' | 'upvoted' | 'downvoted';

/**
 * Derive the current user's vote state from a Problem. The MVP API
 * returns `score` (a sum) but does not always include the per-user vote
 * — until that field lands we assume `neutral`. Update once the
 * `currentUserVote` column is exposed on the GET endpoint.
 */
export function computeVoteState(_problem: Problem): VoteState {
  return 'neutral';
}
