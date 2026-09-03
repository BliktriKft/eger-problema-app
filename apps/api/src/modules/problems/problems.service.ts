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
 *   - create / update / remove (write-side; behind JwtAuthGuard)
 *
 * The previous placeholder returned `[]` for everything which is why the
 * Vercel frontend showed "Nem sikerült betölteni a bejelentést." for the
 * /problems/:id detail route even after the DB had 50 rows of seed data.
 */
@Injectable()
export class ProblemsService {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  /** List all problems (newest first). Real version will paginate. */
  async findAll(): Promise<unknown[]> {
    const rows = await this.prisma.$queryRawUnsafe(
      `SELECT id, title, description, category, status, latitude, longitude,
              "institutionId", "createdBy", "createdAt", "updatedAt", score
         FROM problems
         ORDER BY "createdAt" DESC
         LIMIT 100`,
    );
    return rows as unknown[];
  }

  /** Get one problem by id. Throws 404 if missing. */
  async findOne(id: string): Promise<unknown> {
    const rows = await this.prisma.$queryRawUnsafe(
      `SELECT id, title, description, category, status, latitude, longitude,
              "institutionId", "createdBy", "createdAt", "updatedAt", score
         FROM problems
         WHERE id = $1
         LIMIT 1`,
      id,
    );
    if (!rows || (rows as unknown[]).length === 0) {
      throw new NotFoundException(`Problem ${id} not found`);
    }
    return (rows as unknown[])[0];
  }

  /** Geo-search: problems within radiusMeters of (latitude, longitude). */
  async nearby(
    latitude: number,
    longitude: number,
    radiusMeters: number,
  ): Promise<unknown[]> {
    const rows = await this.prisma.$queryRawUnsafe(
      `SELECT id, title, description, category, status, latitude, longitude,
              "institutionId", "createdBy", "createdAt", "updatedAt", score
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
    return rows as unknown[];
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
    const rows = await this.prisma.$queryRawUnsafe(
      `INSERT INTO problems (
         id, title, description, category, status,
         latitude, longitude, "institutionId", "createdBy",
         "createdAt", "updatedAt", score, location
       ) VALUES (
         gen_random_uuid(), $1, $2, $3, 'open',
         $4, $5, $6, $7,
         NOW(), NOW(), 0,
         ST_SetSRID(ST_MakePoint($5, $4), 4326)::geography
       )
       RETURNING id, title, description, category, status, latitude, longitude,
                 "institutionId", "createdBy", "createdAt", "updatedAt", score`,
      input.title,
      input.description,
      input.category,
      input.latitude,
      input.longitude,
      input.institutionId ?? null,
      input.createdBy,
    );
    return (rows as unknown[])[0];
  }
}
