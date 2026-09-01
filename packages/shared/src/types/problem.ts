import type { ProblemCategory, ProblemStatus } from '../constants/categories.js';

/**
 * Shape returned by the API for a single Problem. Mirrors the
 * `Problem` Prisma model with the GeoJSON `location` collapsed into a
 * flat `{ latitude, longitude }` pair (the canonical projection used by
 * web + mobile clients and Leaflet/react-native-maps).
 */
export interface Problem {
  id: string;
  title: string;
  description: string;
  /** WGS84 latitude in decimal degrees. */
  latitude: number;
  /** WGS84 longitude in decimal degrees. */
  longitude: number;
  category: ProblemCategory;
  status: ProblemStatus;
  /** Optional link to the responsible Institution. Null = civic-level report. */
  institutionId: string | null;
  /** Auth.users id of the user who submitted the report. */
  createdBy: string;
  /** ISO 8601 timestamp. */
  createdAt: string;
  /** Aggregated upvote sum minus downvote sum. Materialised on every vote. */
  score: number;
  /** Optional denormalised institution name for list views. Filled by the API. */
  institutionName?: string | null;
}

/** Subset of `Problem` used when the client only needs the geo marker (map view). */
export type ProblemMarker = Pick<
  Problem,
  'id' | 'title' | 'category' | 'status' | 'latitude' | 'longitude' | 'score'
>;

/** Parameters for the `/problems/nearby` endpoint. */
export interface ProblemNearbyQuery {
  latitude: number;
  longitude: number;
  /** Search radius in metres. */
  radiusMeters: number;
  /** Optional category filter. */
  category?: ProblemCategory;
  /** Result page (1-indexed). */
  page?: number;
  /** Results per page (1..100). */
  pageSize?: number;
}