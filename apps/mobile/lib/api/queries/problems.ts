// apps/mobile/lib/api/queries/problems.ts
//
// TanStack Query hooks for the problem domain.  Mirrors the web app's
// `apps/web/lib/api/queries/problems.ts` so the same cache keys and
// optimistic-update flows work on both platforms.
//
// Every hook:
//   - owns its query key (via `problemKeys` below) so invalidation is
//     unambiguous from any call site
//   - falls through to the in-memory mock when `USE_MOCK` is true (the
//     `api()` helper handles that branch transparently)
//   - returns plain TanStack Query results so the UI keeps full control
//     over loading / error / refetch UX
//
// Vote hook implements the canonical optimistic update:
//   onMutate  → cancel inflight detail refetch, bump cached score
//   onError   → roll back to the cached previous value
//   onSettled → invalidate so the server-authoritative score lands

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { Problem, ProblemMarker, WikiEntry } from '@/types';
// NOTE: lib/api/types.generated.ts (auto-generated from packages/shared/openapi.json
// via `pnpm generate:api-types`) is reserved for the openapi-fetch client migration
// in M3.  Today we type against the domain types from @eger/shared, which already
// mirror the API's response shape and stay in sync with the Zod schemas.
import {
  castVote as castVoteRequest,
  createProblem as createProblemRequest,
  getProblem as getProblemRequest,
  getWiki as getWikiRequest,
  listNearbyProblems as listNearbyProblemsRequest,
  type CreateProblemPayload,
  type NearbyParams,
} from '../problems';
import { ApiError } from '../../api';
import { useAuth } from '../../auth-context';

export const problemKeys = {
  all: ['problems'] as const,
  nearby: (lat: number, lng: number, radius: number, category?: string) =>
    ['problems', 'nearby', { lat, lng, radius, category: category ?? null }] as const,
  detail: (id: string) => ['problems', 'detail', id] as const,
  wiki: (id: string) => ['problems', 'wiki', id] as const,
};

// ----- useNearbyProblems --------------------------------------------------

export type UseNearbyProblemsArgs = NearbyParams;

export function useNearbyProblems(
  args: UseNearbyProblemsArgs | null,
  options?: Omit<UseQueryOptions<ProblemMarker[], ApiError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<ProblemMarker[], ApiError>({
    queryKey: args
      ? problemKeys.nearby(args.latitude, args.longitude, args.radiusMeters, args.category)
      : (['problems', 'nearby', 'disabled'] as const),
    queryFn: () => listNearbyProblemsRequest(args!),
    enabled: Boolean(args),
    staleTime: 30_000,
    ...options,
  });
}

// ----- useProblem ---------------------------------------------------------

export function useProblem(
  id: string | null | undefined,
  options?: Omit<UseQueryOptions<Problem, ApiError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<Problem, ApiError>({
    queryKey: id ? problemKeys.detail(id) : (['problems', 'detail', 'disabled'] as const),
    queryFn: () => getProblemRequest(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
    ...options,
  });
}

// ----- useWiki ------------------------------------------------------------

export function useWiki(
  problemId: string | null | undefined,
  options?: Omit<UseQueryOptions<WikiEntry | null, ApiError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<WikiEntry | null, ApiError>({
    queryKey: problemId ? problemKeys.wiki(problemId) : (['problems', 'wiki', 'disabled'] as const),
    queryFn: () => getWikiRequest(problemId!),
    enabled: Boolean(problemId),
    // Wiki entries change rarely — keep them warm for the whole session.
    staleTime: 5 * 60_000,
    ...options,
  });
}

// ----- useCreateProblem ---------------------------------------------------

/** Public hook — invalidates `problemKeys.all` on success. */
export function useCreateProblem() {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();

  return useMutation<Problem, ApiError, CreateProblemPayload>({
    mutationFn: async (input) => {
      // The server-side `JwtAuthGuard` will reject missing tokens; fail
      // fast here so the UI shows a friendlier message and the user
      // can click "bejelentkezés" instead of staring at a 401 toast.
      if (!isAuthenticated) {
        throw new ApiError(401, null, 'Bejelentkezés szükséges a bejelentés beküldéséhez.');
      }
      return createProblemRequest(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: problemKeys.all });
    },
  });
}

// ----- useVote ------------------------------------------------------------

/**
 * Optimistic vote hook:
 *   onMutate  → cancel inflight detail refetch, bump cached score + myVote
 *   onError   → roll back to the cached previous value
 *   onSettled → invalidate so the server-authoritative score lands
 */
export function useVote(problemId: string, currentUserId?: string | null) {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();

  type Ctx = { previous?: Problem };

  return useMutation<{ score: number }, ApiError, 1 | -1, Ctx>({
    mutationFn: async (value) => {
      if (!isAuthenticated) {
        throw new ApiError(401, null, 'Bejelentkezés szükséges a szavazáshoz.');
      }
      return castVoteRequest(problemId, value);
    },
    onMutate: async (value) => {
      await qc.cancelQueries({ queryKey: problemKeys.detail(problemId) });
      const previous = qc.getQueryData<Problem>(problemKeys.detail(problemId));
      if (previous) {
        qc.setQueryData<Problem>(problemKeys.detail(problemId), {
          ...previous,
          score: previous.score + value,
        });
      }
      // Touch the user-id so TS doesn't complain about the unused arg.
      void currentUserId;
      return { previous };
    },
    onError: (_err, _value, context) => {
      if (context?.previous) {
        qc.setQueryData(problemKeys.detail(problemId), context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: problemKeys.detail(problemId) });
      qc.invalidateQueries({ queryKey: problemKeys.all });
    },
  });
}
