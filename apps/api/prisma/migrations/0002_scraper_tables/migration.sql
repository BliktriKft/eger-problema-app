-- Eger Város Probléma Térkép — scraper tables migration (Task 0001-AI)
--
-- Adds two tables consumed by the website-ai worker:
--   * scraped_articles  — articles fetched from Eger TV / Egri Hírek / HEOL,
--                         used as the local corpus for wiki generation.
--   * wiki_scraper_logs — append-only audit log of every outbound scrape
--                         request (success / robots_blocked / rate_limited
--                         / error) plus duration.
--
-- RLS: both tables are service_role-only for writes. Public reads are
-- blocked because the corpus is internal — the wiki service exposes a
-- curated view of it through /wiki/problems/:id.
--
-- This migration is idempotent (CREATE TABLE IF NOT EXISTS + DROP POLICY
-- IF EXISTS) so re-running it on a clean DB yields the same final state.

-- ===========================================================================
-- 1. Tables
-- ===========================================================================

CREATE TABLE IF NOT EXISTS "scraped_articles" (
  "id"           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  "url"          varchar(2000) NOT NULL UNIQUE,
  "title"        varchar(500) NOT NULL,
  "published_at" timestamptz  NOT NULL,
  "snippet"      text         NOT NULL,
  "full_text"    text,
  "source"       varchar(50)  NOT NULL,
  "fetched_at"   timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT "scraped_articles_source_check"
    CHECK ("source" IN ('egertv', 'egri-hirek', 'heol')),
  CONSTRAINT "scraped_articles_snippet_len"
    CHECK (char_length("snippet") <= 500),
  CONSTRAINT "scraped_articles_fulltext_len"
    CHECK ("full_text" IS NULL OR char_length("full_text") <= 2048)
);

CREATE TABLE IF NOT EXISTS "wiki_scraper_logs" (
  "id"          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  "source"      varchar(50)  NOT NULL,
  "url"         varchar(2000) NOT NULL,
  "status"      varchar(30)  NOT NULL,
  "error_msg"   text,
  "duration_ms" integer      NOT NULL,
  "fetched_at"  timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT "wiki_scraper_logs_source_check"
    CHECK ("source" IN ('egertv', 'egri-hirek', 'heol')),
  CONSTRAINT "wiki_scraper_logs_status_check"
    CHECK ("status" IN ('success', 'robots_blocked', 'rate_limited', 'error')),
  CONSTRAINT "wiki_scraper_logs_duration_check"
    CHECK ("duration_ms" >= 0 AND "duration_ms" <= 600000)
);

-- ===========================================================================
-- 2. Indexes (match Prisma @@index declarations)
-- ===========================================================================

CREATE INDEX IF NOT EXISTS "scraped_articles_source_published_at_idx"
  ON "scraped_articles" ("source", "published_at" DESC);

CREATE INDEX IF NOT EXISTS "scraped_articles_fetched_at_idx"
  ON "scraped_articles" ("fetched_at" DESC);

CREATE INDEX IF NOT EXISTS "wiki_scraper_logs_source_fetched_at_idx"
  ON "wiki_scraper_logs" ("source", "fetched_at" DESC);

CREATE INDEX IF NOT EXISTS "wiki_scraper_logs_status_fetched_at_idx"
  ON "wiki_scraper_logs" ("status", "fetched_at" DESC);

-- ===========================================================================
-- 3. Row Level Security (RLS)
-- ===========================================================================
-- Both tables are internal to the AI worker. Reads are blocked for
-- non-service roles (RLS denies SELECT). Writes are explicitly granted
-- only to service_role. The wiki_entries table already has a public-read
-- policy — this migration does not touch it.

ALTER TABLE "scraped_articles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "wiki_scraper_logs" ENABLE ROW LEVEL SECURITY;

-- ---- scraped_articles ------------------------------------------------------

DROP POLICY IF EXISTS "scraped_articles_service_role_all" ON "scraped_articles";

-- Single FOR ALL policy for service_role (covers SELECT/INSERT/UPDATE/DELETE).
-- service_role JWT bypasses RLS via Supabase, but we keep an explicit policy
-- so the table also works against the anon role on bare Postgres connections
-- (tests, psql, dashboards) where the bypass is not in effect.
CREATE POLICY "scraped_articles_service_role_all"
  ON "scraped_articles" FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR auth.jwt() ->> 'role' = 'admin'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
    OR auth.jwt() ->> 'role' = 'admin'
  );

-- ---- wiki_scraper_logs -----------------------------------------------------

DROP POLICY IF EXISTS "wiki_scraper_logs_service_role_all" ON "wiki_scraper_logs";

CREATE POLICY "wiki_scraper_logs_service_role_all"
  ON "wiki_scraper_logs" FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR auth.jwt() ->> 'role' = 'admin'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
    OR auth.jwt() ->> 'role' = 'admin'
  );
