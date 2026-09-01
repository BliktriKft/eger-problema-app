import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/**
 * Voting service placeholder.
 *
 * Real responsibilities (Task 5):
 *   - POST /problems/:id/vote  — UPSERT (user can change their vote)
 *   - Recompute `problems.score` in the same transaction
 *   - RLS guarantees users only write their own row
 *   - Rate limit to 1 vote / 5 s per user (anti-spam)
 */
@Injectable()
export class VotingService {
  constructor(private readonly prisma: PrismaClient) {}

  cast(): Promise<unknown> {
    return Promise.resolve({ score: 0 });
  }
}