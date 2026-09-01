import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/**
 * Problems service placeholder.
 *
 * Real responsibilities (Task 3):
 *   - CRUD over the `problems` table
 *   - /problems/nearby?lat&lng&radius via raw SQL using ST_DWithin
 *   - Maintain the `score` column (read-side; voting service is write-side)
 *   - Expose Problem markers for the map view (slim payload)
 */
@Injectable()
export class ProblemsService {
  constructor(private readonly prisma: PrismaClient) {}

  findAll(): Promise<unknown[]> {
    return Promise.resolve([]);
  }
}