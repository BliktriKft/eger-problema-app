-- Add a `role` column to `public.users` so we can gate admin-only
-- NestJS endpoints (institutions CRUD, scraper sync, wiki regenerate).
--
-- Roles:
--   user       - default, can read + submit + vote
--   moderator  - can change problem status / delete
--   admin      - full management (institutions, scraper, wiki)
--
-- This is intentionally set via the Supabase SQL editor by the project
-- owner — there is no public endpoint that elevates a user. The
-- NestJS JwtAuthGuard reads role from the users table on every
-- authenticated request (cached for the lifetime of the access token).

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role varchar(20) NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'moderator', 'admin'));

-- Helpful partial index for 'who is an admin/moderator' queries.
CREATE INDEX IF NOT EXISTS users_role_idx
  ON public.users (role)
  WHERE role <> 'user';

-- Add a small helper RPC so the Vercel frontend can fetch the
-- caller's role + profile in one round trip. Service-role only;
-- regular users hit this through the standard auth.getUser path.
-- (Implemented in code rather than SQL since AuthService already
-- has the Prisma client wired up.)
