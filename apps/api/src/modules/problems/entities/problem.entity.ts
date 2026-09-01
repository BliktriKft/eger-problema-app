import { ApiProperty } from "@nestjs/swagger";
import {
  PROBLEM_CATEGORIES,
  PROBLEM_STATUSES,
  PROBLEM_TITLE_MAX_LENGTH,
} from "@eger/shared";

/**
 * Response schema for a Problem (mirrors `Problem` in
 * `@eger/shared/types/problem.ts` + the DB row).
 *
 * The `Problem` interface (returned by the API) is the source of truth;
 * this class only adds Swagger decorators so `@nestjs/swagger` serialises
 * accurate JSON Schemas into `openapi.json`.
 */
export class ProblemEntity {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ maxLength: PROBLEM_TITLE_MAX_LENGTH })
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ minimum: -90, maximum: 90 })
  latitude!: number;

  @ApiProperty({ minimum: -180, maximum: 180 })
  longitude!: number;

  @ApiProperty({ enum: PROBLEM_CATEGORIES })
  category!: (typeof PROBLEM_CATEGORIES)[number];

  @ApiProperty({ enum: PROBLEM_STATUSES })
  status!: (typeof PROBLEM_STATUSES)[number];

  @ApiProperty({ format: "uuid", nullable: true })
  institutionId!: string | null;

  @ApiProperty({ format: "uuid" })
  createdBy!: string;

  @ApiProperty({ format: "date-time" })
  createdAt!: string;

  @ApiProperty()
  score!: number;

  @ApiProperty({ type: String, nullable: true, required: false })
  institutionName?: string | null;
}