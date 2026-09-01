/**
 * Public projection of a user. Mirrors the `User` Prisma model that we
 * keep in sync with Supabase `auth.users`. We only expose the fields that
 * the UI needs; email is intentionally NOT returned by list endpoints.
 */
export interface PublicUser {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

/** Self-view (used by `/auth/me`). Includes email + creation timestamp. */
export interface CurrentUser extends PublicUser {
  email: string;
  createdAt: string;
}