/**
 * Domain constants for the Eger Város Probléma Térkép.
 *
 * These string-literal unions MUST stay byte-for-byte in sync with the
 * Prisma enums in `apps/api/prisma/schema.prisma`. The migration in
 * `apps/api/prisma/migrations/0001_init/migration.sql` creates the matching
 * Postgres enum types.
 *
 * If you add or rename a value here, also:
 *   1. Update the corresponding Prisma enum in `schema.prisma`.
 *   2. Run `pnpm --filter @eger/api prisma migrate dev` to regenerate the
 *      Postgres enum + client.
 *   3. Bump `@eger/shared` consumers (web, mobile, api) — TypeScript will
 *      surface every breaking call site.
 */

/** Categories for a Problem report. Keep aligned with the Prisma `ProblemCategory` enum. */
export const PROBLEM_CATEGORIES = [
  'infrastructure',
  'public_safety',
  'environment',
  'institution',
  'transport',
  'other',
] as const;
export type ProblemCategory = (typeof PROBLEM_CATEGORIES)[number];

/** Human-readable Hungarian labels for `ProblemCategory`. UI-only. */
export const PROBLEM_CATEGORY_LABELS_HU: Readonly<Record<ProblemCategory, string>> = {
  infrastructure: 'Infrastruktúra',
  public_safety: 'Közbiztonság',
  environment: 'Környezet',
  institution: 'Intézmény',
  transport: 'Közlekedés',
  other: 'Egyéb',
};

/** Lifecycle states for a Problem report. Keep aligned with the Prisma `ProblemStatus` enum. */
export const PROBLEM_STATUSES = [
  'open',
  'investigating',
  'resolved',
  'closed',
] as const;
export type ProblemStatus = (typeof PROBLEM_STATUSES)[number];

/** Human-readable Hungarian labels for `ProblemStatus`. UI-only. */
export const PROBLEM_STATUS_LABELS_HU: Readonly<Record<ProblemStatus, string>> = {
  open: 'Nyitott',
  investigating: 'Vizsgálat alatt',
  resolved: 'Megoldva',
  closed: 'Lezárva',
};

/** Categories for an Institution. Keep aligned with the Prisma `InstitutionType` enum. */
export const INSTITUTION_TYPES = [
  'school',
  'hospital',
  'pool',
  'library',
  'government',
  'other',
] as const;
export type InstitutionType = (typeof INSTITUTION_TYPES)[number];

/** Human-readable Hungarian labels for `InstitutionType`. UI-only. */
export const INSTITUTION_TYPE_LABELS_HU: Readonly<Record<InstitutionType, string>> = {
  school: 'Iskola',
  hospital: 'Kórház / egészségügy',
  pool: 'Uszoda / strand',
  library: 'Könyvtár',
  government: 'Önkormányzat / hivatal',
  other: 'Egyéb közintézmény',
};

/** Allowed vote values. Enforced both at the DB level (CHECK constraint) and here. */
export const VOTE_VALUES = [-1, 1] as const;
export type VoteValue = (typeof VOTE_VALUES)[number];

/** Maximum number of characters accepted by the wiki entry body. Mirrors the DB CHECK constraint. */
export const WIKI_BODY_MAX_LENGTH = 1500;

/** Maximum number of characters accepted by the problem title. Mirrors the DB column length. */
export const PROBLEM_TITLE_MAX_LENGTH = 200;

/** Default geo-search radius in metres for the `nearby` endpoint. */
export const DEFAULT_NEARBY_RADIUS_M = 2000;

/** Hard cap for `nearby` radius, so a client cannot DoS the DB with a global scan. */
export const MAX_NEARBY_RADIUS_M = 50_000;
