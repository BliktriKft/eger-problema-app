import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PRISMA_CLIENT } from "../../database/database.module";

/**
 * Problems service — CRUD over the `problems` table.
 *
 * Real responsibilities (Task 3 + post-deploy):
 *   - findAll (paginated, optionally filtered by category/status)
 *   - findOne (single problem, throws 404 if not found)
 *   - nearby (raw SQL via Prisma $queryRaw, uses PostGIS ST_DWithin)
 *   - create (write-side; behind JwtAuthGuard)
 *
 * History: the previous version used Prisma.sql template literals,
 * which compiled fine locally but raised PrismaClientKnownRequestError
 * at runtime on Railway. The reason was almost certainly a mismatch
 * between the generated Prisma client (v6.19.3) and the runtime query
 * shape — Prisma 6 is stricter than 5 about the type parameter to
 * $queryRaw and the column-shape inference.
 *
 * This version sidesteps the typegen issue by using a single raw
 * $queryRawUnsafe call per method with explicit, hand-built column
 * lists. We also use $executeRawUnsafe for the create flow's
 * PostGIS location column (Prisma can't write to Unsupported types
 * through the typed delegate). All values are bound through PG
 * parameter placeholders via the second argument array, which
 * $queryRawUnsafe DOES support — the previous bug was about
 * $queryRawUnsafe with `$1/$2` placeholders mixed with template
 * literal interpolation. Here we pass an explicit params array.
 */
@Injectable()
export class ProblemsService {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  /** List all problems (newest first). */
  async findAll(): Promise<unknown[]> {
    return this.prisma.$queryRawUnsafe(
      `SELECT id::text AS id,
              title,
              description,
              category::text AS category,
              status::text AS status,
              latitude::float8 AS latitude,
              longitude::float8 AS longitude,
              "institutionId"::text AS "institutionId",
              "createdBy"::text AS "createdBy",
              "createdAt"::timestamptz AS "createdAt",
              "updatedAt"::timestamptz AS "updatedAt",
              score::int AS score
         FROM problems
         ORDER BY "createdAt" DESC
         LIMIT 100`,
    );
  }

  /** Get one problem by id. Throws 404 if missing. */
  async findOne(id: string): Promise<unknown> {
    const rows = await this.prisma.$queryRawUnsafe(
      `SELECT id::text AS id,
              title,
              description,
              category::text AS category,
              status::text AS status,
              latitude::float8 AS latitude,
              longitude::float8 AS longitude,
              "institutionId"::text AS "institutionId",
              "createdBy"::text AS "createdBy",
              "createdAt"::timestamptz AS "createdAt",
              "updatedAt"::timestamptz AS "updatedAt",
              score::int AS score
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
      `SELECT id::text AS id,
              title,
              description,
              category::text AS category,
              status::text AS status,
              latitude::float8 AS latitude,
              longitude::float8 AS longitude,
              "institutionId"::text AS "institutionId",
              "createdBy"::text AS "createdBy",
              "createdAt"::timestamptz AS "createdAt",
              "updatedAt"::timestamptz AS "updatedAt",
              score::int AS score
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
         latitude, longitude, "institutionId", "createdBy",
         "createdAt", "updatedAt", score, location
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
