// types/index.ts — re-export the shared domain types so consumers in this app
// can do `import { Problem } from '@/types'`.  The actual definitions live in
// `@eger/shared` (dual ESM+CJS exports).
export type {
  Problem,
  ProblemMarker,
  ProblemNearbyQuery,
} from '@eger/shared';

export type { Vote } from '@eger/shared';
export type { PublicUser, CurrentUser } from '@eger/shared';
export type { Institution } from '@eger/shared';
export type { WikiEntry } from '@eger/shared';

export {
  PROBLEM_CATEGORIES,
  PROBLEM_CATEGORY_LABELS_HU,
  PROBLEM_STATUSES,
  PROBLEM_STATUS_LABELS_HU,
  INSTITUTION_TYPES,
  INSTITUTION_TYPE_LABELS_HU,
  VOTE_VALUES,
  WIKI_BODY_MAX_LENGTH,
  PROBLEM_TITLE_MAX_LENGTH,
  DEFAULT_NEARBY_RADIUS_M,
  MAX_NEARBY_RADIUS_M,
} from '@eger/shared';

export type {
  ProblemCategory,
  ProblemStatus,
  InstitutionType,
  VoteValue,
} from '@eger/shared';
