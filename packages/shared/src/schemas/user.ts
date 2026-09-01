import { z } from 'zod';

export const PublicUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
});
export type PublicUserInput = z.infer<typeof PublicUserSchema>;

export const CurrentUserSchema = PublicUserSchema.extend({
  email: z.string().email(),
  createdAt: z.string().datetime(),
});
export type CurrentUserInput = z.infer<typeof CurrentUserSchema>;
