import { Inject, Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PRISMA_CLIENT } from "../../database/database.module";

/**
 * Wiki service placeholder (read-only stub).
 *
 * Real responsibilities (V2, website-ai):
 *   - GET  /problems/:id/wiki   — fetch the WikiEntry for a Problem
 *   - POST /problems/:id/wiki/regenerate  — service_role-only; AI worker calls
 *     this after generating a new entry. RLS blocks non-service-role writes.
 */
@Injectable()
export class WikiService {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  find(): Promise<unknown> {
    return Promise.resolve(null);
  }
}