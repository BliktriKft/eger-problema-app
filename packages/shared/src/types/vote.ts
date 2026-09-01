import type { VoteValue } from '../constants/categories.js';

export interface Vote {
  id: string;
  problemId: string;
  userId: string;
  value: VoteValue;
  /** ISO 8601 timestamp. */
  createdAt: string;
}