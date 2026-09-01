import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/**
 * Institutions service placeholder.
 *
 * Real responsibilities (Task 4):
 *   - GET /institutions  (public, filterable by type + search)
 *   - GET /institutions/:id
 *   - POST/PATCH/DELETE  (admin-only, gated by RLS)
 *   - Seeded with the 20 Eger institutions in `prisma/seed.ts`
 */
@Injectable()
export class InstitutionsService {
  constructor(private readonly prisma: PrismaClient) {}

  findAll(): Promise<unknown[]> {
    return Promise.resolve([]);
  }
}