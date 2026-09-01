import { z } from 'zod';
import {
  PROBLEM_CATEGORIES,
  PROBLEM_STATUSES,
  PROBLEM_TITLE_MAX_LENGTH,
} from '../constants/categories.js';

/**
 * Reusable coordinate pair — used by every DTO that needs a geo point
 * (problem create, nearby query, etc.). The API applies the same
 * WGS84 bounds as the DB CHECK constraint.
 */
export const LatLngSchema = z.object({
  latitude: z
    .number({ required_error: 'latitude is required', invalid_type_error: 'latitude must be a number' })
    .gte(-90, 'latitude must be between -90 and 90')
    .lte(90, 'latitude must be between -90 and 90'),
  longitude: z
    .number({ required_error: 'longitude is required', invalid_type_error: 'longitude must be a number' })
    .gte(-180, 'longitude must be between -180 and 180')
    .lte(180, 'longitude must be between -180 and 180'),
});
export type LatLng = z.infer<typeof LatLngSchema>;

export const ProblemCategorySchema = z.enum(PROBLEM_CATEGORIES);
export const ProblemStatusSchema = z.enum(PROBLEM_STATUSES);

/** Payload for `POST /problems`. */
export const CreateProblemSchema = z.object({
  title: z
    .string({ required_error: 'title is required' })
    .trim()
    .min(3, 'title must be at least 3 characters')
    .max(PROBLEM_TITLE_MAX_LENGTH, `title must be at most ${PROBLEM_TITLE_MAX_LENGTH} characters`),
  description: z
    .string({ required_error: 'description is required' })
    .trim()
    .min(10, 'description must be at least 10 characters')
    .max(5000, 'description must be at most 5000 characters'),
  category: ProblemCategorySchema,
  institutionId: z.string().uuid().nullable().optional(),
}).merge(LatLngSchema);
export type CreateProblemInput = z.infer<typeof CreateProblemSchema>;

/** Payload for `PATCH /problems/:id`. All fields optional. */
export const UpdateProblemSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3)
      .max(PROBLEM_TITLE_MAX_LENGTH)
      .optional(),
    description: z.string().trim().min(10).max(5000).optional(),
    category: ProblemCategorySchema.optional(),
    status: ProblemStatusSchema.optional(),
    institutionId: z.string().uuid().nullable().optional(),
  })
  .strict();
export type UpdateProblemInput = z.infer<typeof UpdateProblemSchema>;

/** Query for `GET /problems/nearby`. */
export const QueryNearbySchema = LatLngSchema.extend({
  radiusMeters: z.coerce.number().int().positive().max(50_000),
  category: ProblemCategorySchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type QueryNearbyInput = z.infer<typeof QueryNearbySchema>;

/**
 * Response envelope for a single Problem. We expose `latitude`/`longitude`
 * as flat fields — the PostGIS `geography(Point, 4326)` column is
 * serialized via `ST_X`/`ST_Y` in the API layer.
 */
export const ProblemResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  category: ProblemCategorySchema,
  status: ProblemStatusSchema,
  institutionId: z.string().uuid().nullable(),
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
  score: z.number().int(),
  institutionName: z.string().nullable().optional(),
});
export type ProblemResponse = z.infer<typeof ProblemResponseSchema>;
