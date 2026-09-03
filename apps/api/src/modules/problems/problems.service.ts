import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";
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
 * The previous placeholder returned `[]` for everything which is why
 * the Vercel frontend showed "Nem sikerült betölteni a bejelentést."
 * for the /problems/:id detail route even after the DB had 50 rows of
 * seed data. We use Prisma.$queryRaw (template literal) instead of
 * $queryRawUnsafe because the latter does NOT substitute $1/$2 — it
 * just hands the string to PG, which then fails to recognise the
 * positional parameters and raises PrismaClientKnownRequestError.
 *
 * $queryRaw with Prisma.sql template literals gives us Prisma-style
 * ${var} interpolation that PG accepts.
 */
@Injectable()
export class ProblemsService {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  /** List all problems (newest first). Real version will paginate. */
  async findAll(): Promise<unknown[]> {
    return this.prisma.$queryRaw<unknown[]>(Prisma.sql`
      SELECT id, title, description, category, status, latitude, longitude,
             "institutionId", "createdBy", "createdAt", "updatedAt", score
        FROM problems
        ORDER BY "createdAt" DESC
        LIMIT 100
    `);
  }

  /** Get one problem by id. Throws 404 if missing. */
  async findOne(id: string): Promise<unknown> {
    const rows = await this.prisma.$queryRaw<unknown[]>(Prisma.sql`
      SELECT id, title, description, category, status, latitude, longitude,
             "institutionId", "createdBy", "createdAt", "updatedAt", score
        FROM problems
        WHERE id = ${id}
        LIMIT 1
    `);
    if (!rows || rows.length === 0) {
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
    return this.prisma.$queryRaw<unknown[]>(Prisma.sql`
      SELECT id, title, description, category, status, latitude, longitude,
             "institutionId", "createdBy", "createdAt", "updatedAt", score
        FROM problems
        WHERE ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${radiusMeters}
        )
        ORDER BY ST_Distance(
          location,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        ) ASC
        LIMIT 100
    `);
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
    const rows = await this.prisma.$queryRaw<unknown[]>(Prisma.sql`
      INSERT INTO problems (
        id, title, description, category, status,
        latitude, longitude, "institutionId", "createdBy",
        "createdAt", "updatedAt", score, location
      ) VALUES (
        gen_random_uuid(),
        ${input.title},
        ${input.description},
        ${input.category},
        'open',
        ${input.latitude},
        ${input.longitude},
        ${input.institutionId ?? null},
        ${input.createdBy},
        NOW(),
        NOW(),
        0,
        ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography
      )
      RETURNING id, title, description, category, status, latitude, longitude,
                "institutionId", "createdBy", "createdAt", "updatedAt", score
    `);
    return rows[0];
  }
}
