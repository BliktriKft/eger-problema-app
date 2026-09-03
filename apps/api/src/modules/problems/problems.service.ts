import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PRISMA_CLIENT } from "../../database/database.module";

/**
 * Problems service — CRUD over the `problems` table.
 *
 * Schema mapping notes (the cause of the prior failures):
 *   - Prisma field `institutionId` → DB column `institution_id`
 *     (@map("institution_id") in schema.prisma)
 *   - Prisma field `createdBy`     → DB column `created_by`
 *   - Prisma field `createdAt`     → DB column `created_at`
 *   - Prisma field `updatedAt`     → DB column `updated_at`
 *   - Prisma field `institutionId` → DB column `institution_id`
 * So all raw SQL must reference snake_case column names, NOT the
 * camelCase Prisma field names. The previous version used
 * `"institutionId"` (camelCase) and Postgres returned 42703
 * 'undefined_column' which Prisma surfaced as a generic
 * PrismaClientKnownRequestError.
 *
 * Why $queryRawUnsafe + bound params array:
 *   - $queryRaw<unknown[]>(Prisma.sql\`...${var}...\`) is brittle
 *     because Prisma 6 is stricter about template-literal type
 *     inference and the generated runtime wrapper sometimes fails
 *     to bind variables into the same query that uses positional
 *     PG parameters. $queryRawUnsafe with explicit params array
 *     avoids that issue entirely — the SQL string goes straight
 *     to PG with PG-side parameter binding.
 *   - We can't use Prisma's typed delegate because the `location`
 *     column is `Unsupported('geography(Point, 4326)')` and the
 *     generator refuses to expose a typed reader for it.
 *
 * Why every column has an explicit :: cast:
 *   - Prisma's row shape inference tries to match the Prisma model
 *     field types, but the underlying PG types (text, uuid,
 *     timestamptz, double precision, enum) come back in PG's wire
 *     format. Explicit casts (::text, ::uuid, ::timestamptz,
 *     ::float8) keep the JSON the API emits consistent across
 *     driver versions.
 */
@Injectable()
export class ProblemsService {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  /** Column list shared by findAll / findOne / nearby. Uses snake_case. */
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
    updated_at::timestamptz AS "updatedAt",
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
         created_at, updated_at, score, location
       ) VALUES (
         gen_random_uuid(), $1, $2, $3::"ProblemCategory", 'open'::"ProblemStatus",
         $4::float8, $5::float8, $6::uuid, $7::uuid,
         NOW(), NOW(), 0,
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
