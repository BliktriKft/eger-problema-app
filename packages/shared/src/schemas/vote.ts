import { z } from 'zod';
import { VOTE_VALUES } from '../constants/categories.js';

export const VoteValueSchema = z
  .number()
  .int()
  .refine((v): v is -1 | 1 => (VOTE_VALUES as readonly number[]).includes(v), {
    message: 'value must be +1 or -1',
  });

/** Payload for `POST /problems/:id/vote`. */
export const CastVoteSchema = z.object({
  value: VoteValueSchema,
});
export type CastVoteInput = z.infer<typeof CastVoteSchema>;
