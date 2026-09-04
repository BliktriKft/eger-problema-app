import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PRISMA_CLIENT } from "../../database/database.module";
import type { CreateInstitutionDto } from "./dto/create-institution.dto";
import type { UpdateInstitutionDto } from "./dto/update-institution.dto";

/**
 * Institutions service — full CRUD over the `institutions` table.
 *
 * All queries use $queryRawUnsafe with snake_case column names +
 * explicit :: casts. The previous placeholder returned [] for
 * everything, which is why /api/institutions was empty even after
 * the SQL seed uploaded 20 rows. We rely on the same snake_case
 * convention the ProblemsService established (Prisma @map →
 * snake_case DB columns).
 */
@Injectable()
export class InstitutionsService {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  /** Column list shared across reads. Matches Prisma Institution shape. */
  private static readonly COLUMNS = `
    id::text AS id,
    name,
    type::text AS type,
    address,
    latitude::float8 AS latitude,
    longitude::float8 AS longitude,
    official_url::text AS "officialUrl",
    created_at::timestamptz AS "createdAt",
    updated_at::timestamptz AS "updatedAt"
  `;

  async findAll(): Promise<unknown[]> {
    return this.prisma.$queryRawUnsafe(
      `SELECT ${InstitutionsService.COLUMNS}
         FROM institutions
         ORDER BY name ASC
         LIMIT 100`,
    );
  }

  async findOne(id: string): Promise<unknown> {
    const rows = await this.prisma.$queryRawUnsafe(
      `SELECT ${InstitutionsService.COLUMNS}
         FROM institutions
         WHERE id::text = $1::text
         LIMIT 1`,
      id,
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new NotFoundException(`Institution ${id} not found`);
    }
    return rows[0];
  }

  async create(input: CreateInstitutionDto): Promise<unknown> {
    const rows = await this.prisma.$queryRawUnsafe(
      `INSERT INTO institutions (
         id, name, type, address, latitude, longitude, official_url,
         created_at, updated_at
       ) VALUES (
         gen_random_uuid(), $1, $2::"InstitutionType", $3,
         $4::float8, $5::float8, $6,
         NOW(), NOW()
       )
       RETURNING ${InstitutionsService.COLUMNS}`,
      input.name,
      input.type,
      input.address,
      input.latitude,
      input.longitude,
      input.officialUrl ?? null,
    );
    return (rows as unknown[])[0];
  }

  /**
   * Apply a partial update. We only SET the fields that were sent —
   * `Object.entries(input).filter(([, v]) => v !== undefined)` gives
   * us the field list, and we build the SET clause by hand so the
   * columns are snake_case while the DTO is camelCase.
   */
  async update(id: string, input: UpdateInstitutionDto): Promise<unknown> {
    const fieldMap: Record<string, { column: string; cast?: string }> = {
      name: { column: "name" },
      type: { column: "type", cast: '::"InstitutionType"' },
      address: { column: "address" },
      latitude: { column: "latitude", cast: "::float8" },
      longitude: { column: "longitude", cast: "::float8" },
      officialUrl: { column: "official_url" },
    };
    const entries = Object.entries(input).filter(
      ([, v]) => v !== undefined,
    ) as Array<[keyof UpdateInstitutionDto, unknown]>;

    if (entries.length === 0) {
      return this.findOne(id);
    }

    const setClauses = entries
      .map(([key], i) => {
        const meta = fieldMap[key as string];
        if (!meta) throw new Error(`Unknown institution field: ${String(key)}`);
        return `${meta.column} = $${i + 2}${meta.cast ?? ""}`;
      })
      .join(", ");

    const values = entries.map(([, v]) => v as unknown);

    const rows = await this.prisma.$queryRawUnsafe(
      `UPDATE institutions
         SET ${setClauses}, updated_at = NOW()
         WHERE id::text = $1::text
         RETURNING ${InstitutionsService.COLUMNS}`,
      id,
      ...values,
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new NotFoundException(`Institution ${id} not found`);
    }
    return rows[0];
  }

  /**
   * Delete an institution. We rely on the FK ON DELETE SET NULL
   * constraint from problems.institution_id to keep the
   * referencing rows intact; problems will keep the column but
   * with null (matching the @relation onDelete: SetNull in the
   * Prisma schema).
   */
  async remove(id: string): Promise<{ id: string }> {
    const rows = await this.prisma.$queryRawUnsafe(
      `DELETE FROM institutions
         WHERE id::text = $1::text
         RETURNING id::text AS id`,
      id,
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new NotFoundException(`Institution ${id} not found`);
    }
    return rows[0] as { id: string };
  }
}
