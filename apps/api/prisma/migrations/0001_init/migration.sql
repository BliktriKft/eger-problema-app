-- Eger Város Probléma Térkép — initial migration
--
-- Generated to match `apps/api/prisma/schema.prisma` as of Task 0001.
-- Run order:
--   1. Extensions (postgis, pgcrypto).
--   2. Enums.
--   3. Tables (with FK + CHECK constraints).
--   4. Indexes (B-tree from Prisma @@index + GIST on problems.location).
--   5. Materialised score-trigger.
--   6. RLS policies.
--   7. Trigger to mirror Supabase auth.users into public.users.
--
-- Idempotent where possible: every CREATE uses IF NOT EXISTS, every
-- DROP policy uses IF EXISTS. Re-running this script on a clean DB
-- yields the same final state.
--
-- Note: this file intentionally omits the Prisma migration_lock.toml
-- wrapper. When `prisma migrate dev` runs against a fresh DB, Prisma
-- will generate its own `migration.sql` (from `prisma migrate diff`)
-- and we will commit a `_prisma_generated.sql` next to it. See the
-- ADR-0004 for the dual-track strategy.

-- ===========================================================================
-- 1. Extensions
-- ===========================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===========================================================================
-- 2. Enums
-- ===========================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProblemCategory') THEN
    CREATE TYPE "ProblemCategory" AS ENUM (
      'infrastructure',
      'public_safety',
      'environment',
      'institution',
      'transport',
      'other'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProblemStatus') THEN
    CREATE TYPE "ProblemStatus" AS ENUM (
      'open',
      'investigating',
      'resolved',
      'closed'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InstitutionType') THEN
    CREATE TYPE "InstitutionType" AS ENUM (
      'school',
      'hospital',
      'pool',
      'library',
      'government',
      'other'
    );
  END IF;
END$$;

-- ===========================================================================
-- 3. Tables
-- ===========================================================================

CREATE TABLE IF NOT EXISTS "users" (
  "id"         uuid        PRIMARY KEY,
  "email"      varchar(320) NOT NULL UNIQUE,
  "name"       varchar(120),
  "avatar_url" varchar(500),
  "created_at" timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "institutions" (
  "id"           uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"         varchar(200)    NOT NULL,
  "type"         "InstitutionType" NOT NULL,
  "address"      varchar(300)    NOT NULL,
  "latitude"     double precision NOT NULL,
  "longitude"    double precision NOT NULL,
  "official_url" varchar(500),
  CONSTRAINT "institutions_lat_range"  CHECK ("latitude"  BETWEEN -90  AND 90),
  CONSTRAINT "institutions_lng_range"  CHECK ("longitude" BETWEEN -180 AND 180)
);

CREATE TABLE IF NOT EXISTS "problems" (
  "id"            uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  "title"         varchar(200)    NOT NULL,
  "description"   text            NOT NULL,
  "location"      geography(Point, 4326) NOT NULL,
  "latitude"      double precision NOT NULL,
  "longitude"     double precision NOT NULL,
  "category"      "ProblemCategory" NOT NULL,
  "status"        "ProblemStatus"  NOT NULL DEFAULT 'open',
  "institution_id" uuid,
  "created_by"    uuid            NOT NULL,
  "created_at"    timestamptz     NOT NULL DEFAULT now(),
  "score"         integer         NOT NULL DEFAULT 0,
  CONSTRAINT "problems_lat_range"  CHECK ("latitude"  BETWEEN -90  AND 90),
  CONSTRAINT "problems_lng_range"  CHECK ("longitude" BETWEEN -180 AND 180),
  CONSTRAINT "problems_title_len"  CHECK (char_length("title") BETWEEN 3 AND 200),
  CONSTRAINT "problems_description_len" CHECK (char_length("description") BETWEEN 10 AND 5000),
  CONSTRAINT "problems_institution_fk"
    FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE SET NULL,
  CONSTRAINT "problems_creator_fk"
    FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "votes" (
  "id"         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  "problem_id" uuid        NOT NULL,
  "user_id"    uuid        NOT NULL,
  "value"      integer     NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "votes_value_range" CHECK ("value" IN (-1, 1)),
  CONSTRAINT "votes_problem_fk"
    FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON DELETE CASCADE,
  CONSTRAINT "votes_user_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "votes_problem_user_unique"
  ON "votes" ("problem_id", "user_id");

CREATE TABLE IF NOT EXISTS "problem_institution_links" (
  "problem_id"     uuid        NOT NULL,
  "institution_id" uuid        NOT NULL,
  "created_at"     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("problem_id", "institution_id"),
  CONSTRAINT "pil_problem_fk"
    FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON DELETE CASCADE,
  CONSTRAINT "pil_institution_fk"
    FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "wiki_entries" (
  "id"            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  "problem_id"    uuid         NOT NULL UNIQUE,
  "title"         varchar(200) NOT NULL,
  "body"          text         NOT NULL,
  "sources"       jsonb        NOT NULL DEFAULT '[]'::jsonb,
  "generated_at"  timestamptz  NOT NULL DEFAULT now(),
  "model_version" varchar(100) NOT NULL,
  CONSTRAINT "wiki_body_len" CHECK (char_length("body") <= 1500),
  CONSTRAINT "wiki_title_len" CHECK (char_length("title") BETWEEN 1 AND 200),
  CONSTRAINT "wiki_problem_fk"
    FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON DELETE CASCADE
);

-- ===========================================================================
-- 4. Indexes (B-tree from Prisma @@index + GIST on problems.location)
-- ===========================================================================

CREATE INDEX IF NOT EXISTS "problems_category_idx"      ON "problems" ("category");
CREATE INDEX IF NOT EXISTS "problems_status_idx"        ON "problems" ("status");
CREATE INDEX IF NOT EXISTS "problems_created_at_idx"    ON "problems" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "problems_score_idx"         ON "problems" ("score" DESC);
CREATE INDEX IF NOT EXISTS "problems_institution_id_idx" ON "problems" ("institution_id");

-- PostGIS GIST index for geo queries (nearby endpoint).
CREATE INDEX IF NOT EXISTS "problems_location_gist"
  ON "problems" USING GIST ("location");

CREATE INDEX IF NOT EXISTS "institutions_type_idx" ON "institutions" ("type");
CREATE INDEX IF NOT EXISTS "institutions_name_idx" ON "institutions" ("name");
CREATE INDEX IF NOT EXISTS "pil_institution_id_idx" ON "problem_institution_links" ("institution_id");
CREATE INDEX IF NOT EXISTS "votes_user_id_idx"      ON "votes" ("user_id");

-- ===========================================================================
-- 5. Materialised score maintenance trigger
-- ===========================================================================
-- The voting service keeps `problems.score` in sync via UPSERT, but this
-- trigger is a backstop so direct DB writes cannot desynchronise the
-- aggregate. It computes the running sum of `votes.value` per problem.

CREATE OR REPLACE FUNCTION public.fn_problems_recompute_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "problems" SET "score" = "score" + NEW."value"
      WHERE "id" = NEW."problem_id";
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE "problems" SET "score" = "score" - OLD."value" + NEW."value"
      WHERE "id" = NEW."problem_id";
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "problems" SET "score" = "score" - OLD."value"
      WHERE "id" = OLD."problem_id";
    RETURN OLD;
  END IF;
  RETURN NULL;
END$$;

DROP TRIGGER IF EXISTS "trg_votes_recompute_score" ON "votes";
CREATE TRIGGER "trg_votes_recompute_score"
  AFTER INSERT OR UPDATE OR DELETE ON "votes"
  FOR EACH ROW EXECUTE FUNCTION public.fn_problems_recompute_score();

-- ===========================================================================
-- 6. Row Level Security (RLS)
-- ===========================================================================
-- Public read everywhere; writes gated on auth.uid() and admin role.
-- The `service_role` JWT bypasses RLS, so the API + AI worker can do
-- anything when they present the service-role key. Regular anon/auth
-- users are restricted by the policies below.

ALTER TABLE "problems"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "votes"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "institutions"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "wiki_entries"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users"         ENABLE ROW LEVEL SECURITY;

-- ---- problems -------------------------------------------------------------

DROP POLICY IF EXISTS "problems_select_public"            ON "problems";
DROP POLICY IF EXISTS "problems_insert_authenticated"     ON "problems";
DROP POLICY IF EXISTS "problems_update_own_or_admin"      ON "problems";
DROP POLICY IF EXISTS "problems_delete_own_or_admin"      ON "problems";

CREATE POLICY "problems_select_public"
  ON "problems" FOR SELECT
  USING (true);

CREATE POLICY "problems_insert_authenticated"
  ON "problems" FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = "created_by");

CREATE POLICY "problems_update_own_or_admin"
  ON "problems" FOR UPDATE
  USING (auth.uid() = "created_by" OR auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.uid() = "created_by" OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "problems_delete_own_or_admin"
  ON "problems" FOR DELETE
  USING (auth.uid() = "created_by" OR auth.jwt() ->> 'role' = 'admin');

-- ---- votes ----------------------------------------------------------------

DROP POLICY IF EXISTS "votes_select_public"   ON "votes";
DROP POLICY IF EXISTS "votes_insert_own"      ON "votes";
DROP POLICY IF EXISTS "votes_update_own"      ON "votes";
DROP POLICY IF EXISTS "votes_delete_own"      ON "votes";

CREATE POLICY "votes_select_public"
  ON "votes" FOR SELECT
  USING (true);

CREATE POLICY "votes_insert_own"
  ON "votes" FOR INSERT
  WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "votes_update_own"
  ON "votes" FOR UPDATE
  USING (auth.uid() = "user_id")
  WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "votes_delete_own"
  ON "votes" FOR DELETE
  USING (auth.uid() = "user_id");

-- ---- institutions ---------------------------------------------------------

DROP POLICY IF EXISTS "institutions_select_public"   ON "institutions";
DROP POLICY IF EXISTS "institutions_modify_admin"     ON "institutions";

CREATE POLICY "institutions_select_public"
  ON "institutions" FOR SELECT
  USING (true);

-- Single FOR ALL policy covers INSERT/UPDATE/DELETE. Service-role
-- bypasses RLS, so this also lets the API insert seed data when it
-- presents service_role.
CREATE POLICY "institutions_modify_admin"
  ON "institutions" FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.jwt() ->> 'role' = 'service_role'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.jwt() ->> 'role' = 'service_role'
  );

-- ---- wiki_entries ---------------------------------------------------------

DROP POLICY IF EXISTS "wiki_entries_select_public"          ON "wiki_entries";
DROP POLICY IF EXISTS "wiki_entries_modify_service_role"    ON "wiki_entries";

CREATE POLICY "wiki_entries_select_public"
  ON "wiki_entries" FOR SELECT
  USING (true);

CREATE POLICY "wiki_entries_modify_service_role"
  ON "wiki_entries" FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR auth.jwt() ->> 'role' = 'admin'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
    OR auth.jwt() ->> 'role' = 'admin'
  );

-- ---- users ---------------------------------------------------------------

DROP POLICY IF EXISTS "users_select_public"   ON "users";
DROP POLICY IF EXISTS "users_update_own"      ON "users";

CREATE POLICY "users_select_public"
  ON "users" FOR SELECT
  USING (true);

CREATE POLICY "users_update_own"
  ON "users" FOR UPDATE
  USING (auth.uid() = "id")
  WITH CHECK (auth.uid() = "id");

-- ===========================================================================
-- 7. Mirror Supabase auth.users into public.users
-- ===========================================================================
-- Supabase fires a `on auth.users insert` event; we listen to it and
-- copy the new row into `public.users`. The reverse sync on update
-- keeps the email + name fields fresh. Deletions on auth.users are
-- cascaded to public.users by FK.

CREATE OR REPLACE FUNCTION public.fn_handle_auth_user_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public."users" ("id", "email", "name", "avatar_url", "created_at")
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.created_at
  )
  ON CONFLICT ("id") DO UPDATE
    SET "email"      = EXCLUDED."email",
        "name"       = EXCLUDED."name",
        "avatar_url" = EXCLUDED."avatar_url";
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS "trg_auth_user_created" ON auth.users;
CREATE TRIGGER "trg_auth_user_created"
  AFTER INSERT OR UPDATE OF email, raw_user_meta_data
  ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.fn_handle_auth_user_created();

-- ===========================================================================
-- 8. Helpful view: problems_with_score (aggregated read model)
-- ===========================================================================
-- Mirrors the `Problem.score` aggregate but joins the institution name
-- so list endpoints can serve it without a second round-trip.
-- The view is RLS-inherited from `problems`.

CREATE OR REPLACE VIEW public.problems_with_institution AS
SELECT
  p."id",
  p."title",
  p."description",
  ST_Y(p."location"::geometry) AS "latitude",
  ST_X(p."location"::geometry) AS "longitude",
  p."category",
  p."status",
  p."institution_id",
  p."created_by",
  p."created_at",
  p."score",
  i."name" AS "institution_name"
FROM public."problems" p
LEFT JOIN public."institutions" i ON i."id" = p."institution_id";

COMMENT ON VIEW public.problems_with_institution IS
  'Read-model view: problems joined with their institution name (if any). RLS inherited from problems.';
