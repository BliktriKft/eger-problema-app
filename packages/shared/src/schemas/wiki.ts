import { z } from 'zod';
import { WIKI_BODY_MAX_LENGTH } from '../constants/categories.js';

export const WikiSourceSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1).max(300),
  fetchedAt: z.string().datetime(),
});
export type WikiSourceInput = z.infer<typeof WikiSourceSchema>;

export const WikiEntryResponseSchema = z.object({
  id: z.string().uuid(),
  problemId: z.string().uuid(),
  title: z.string(),
  body: z.string().max(WIKI_BODY_MAX_LENGTH),
  sources: z.array(WikiSourceSchema).max(20),
  generatedAt: z.string().datetime(),
  modelVersion: z.string().min(1).max(100),
});
export type WikiEntryResponse = z.infer<typeof WikiEntryResponseSchema>;
