import { z } from 'zod';
import { INSTITUTION_TYPES } from '../constants/categories.js';
import { LatLngSchema } from './problem.js';

export const InstitutionTypeSchema = z.enum(INSTITUTION_TYPES);

export const InstitutionResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: InstitutionTypeSchema,
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  officialUrl: z.string().url().nullable(),
});
export type InstitutionResponse = z.infer<typeof InstitutionResponseSchema>;

/** Query for `GET /institutions`. */
export const QueryInstitutionsSchema = z.object({
  type: InstitutionTypeSchema.optional(),
  search: z.string().trim().min(1).max(100).optional(),
  near: LatLngSchema.pick({ latitude: true, longitude: true }).optional(),
  radiusMeters: z.coerce.number().int().positive().max(50_000).optional(),
});
export type QueryInstitutionsInput = z.infer<typeof QueryInstitutionsSchema>;
