import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PRISMA_CLIENT } from "../../database/database.module";

/**
 * Problems service — CRUD over the `problems` table.
 *
 * Critical schema reality (the cause of the previous failures):
 *   The Prisma schema.prisma has a `updatedAt DateTime @map("updated_at")`
 *   field on the Problem model, BUT the 0001_init migration never
 *   created an `updated_at` column on the `problems` table.
 *   Postgres therefore raises '42703 column "updated_at" does not
 *   exist' on every raw query that references it. So we MUST NOT
 *   select updated_at in raw SQL, even though the Prisma model
 *   thinks it exists.
 *
 *   DB columns that DO exist on `problems`:
 *     id, title, description, location, latitude, longitude,
 *     category, status, institution_id, created_by, created_at,
 *     score
 *   DB columns that DO NOT exist:
 *     updated_at  ← schema.prisma says it should, migration didn't
 *                   create it. We omit it from all SELECTs.
 *
 * Column-name mapping (Prisma field → DB column):
 *   institutionId → institution_id
 *   createdBy     → created_by
 *   createdAt     → created_at
 *   (updatedAt    → updated_at — but we omit it; see above)
 *
 * Why $queryRawUnsafe + bound params array:
 *   - $queryRaw<unknown[]>(Prisma.sql\`...${var}...\`) is brittle in
 *     Prisma 6 (template-literal typegen vs PG positional params
 *     sometimes collide and surface as generic PrismaClientKnownRequestError).
 *   - $queryRawUnsafe('... $1, $2 ...', [var, var]) avoids the
 *     issue — PG handles the parameter binding directly.
 *
 * Why we can't use Prisma's typed delegate at all:
 *   - The `location` column is Unsupported('geography(Point, 4326)').
 *     Prisma's generator refuses to expose a typed field for it,
 *     which breaks the whole typed delegate for the model.
 */
@Injectable()
export class ProblemsService {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  /** Column list shared by findAll / findOne / nearby. */
  private static readonly COLUMNS = `
    id::text AS id,
    title,
    description,
    category::text AS category,
    status::text AS status,
    latitude::float8 AS latitude,
    longitude::float8 AS longitude,
    institution_id::text AS "institutionId",
    created_by::text AS "createdBy",
    created_at::timestamptz AS "createdAt",
    score::int AS score
  `;

  /** List all problems (newest first). */
  async findAll(): Promise<unknown[]> {
    return this.prisma.$queryRawUnsafe(
      `SELECT ${ProblemsService.COLUMNS}
         FROM problems
         ORDER BY created_at DESC
         LIMIT 100`,
    );
  }

  /** Get one problem by id. Throws 404 if missing. */
  async findOne(id: string): Promise<unknown> {
    const rows = await this.prisma.$queryRawUnsafe(
      `SELECT ${ProblemsService.COLUMNS}
         FROM problems
         WHERE id::text = $1::text
         LIMIT 1`,
      id,
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new NotFoundException(`Problem ${id} not found`);
    }
    return rows[0];
  }

  /** Geo-search: problems within radiusMeters of (latitude, longitude). */
  async nearby(
    latitude: number,
    longitude: number,
    radiusMeters: number,
  ): Promise<unknown[]> {
    return this.prisma.$queryRawUnsafe(
      `SELECT ${ProblemsService.COLUMNS}
         FROM problems
         WHERE ST_DWithin(
           location,
           ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
           $3
         )
         ORDER BY ST_Distance(
           location,
           ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
         ) ASC
         LIMIT 100`,
      longitude,
      latitude,
      radiusMeters,
    );
  }

  /** Create a new problem (author is the Supabase auth user). */
  async create(input: {
    title: string;
    description: string;
    category: string;
    latitude: number;
    longitude: number;
    institutionId?: string | null;
    createdBy: string;
  }): Promise<unknown> {
    return this.prisma.$executeRawUnsafe(
      `INSERT INTO problems (
         id, title, description, category, status,
         latitude, longitude, institution_id, created_by,
         created_at, score, location
       ) VALUES (
         gen_random_uuid(), $1, $2, $3::"ProblemCategory", 'open'::"ProblemStatus",
         $4::float8, $5::float8, $6::uuid, $7::uuid,
         NOW(), 0,
         ST_SetSRID(ST_MakePoint($5, $4), 4326)::geography
       )`,
      input.title,
      input.description,
      input.category,
      input.latitude,
      input.longitude,
      input.institutionId ?? null,
      input.createdBy,
    );
  }
}
