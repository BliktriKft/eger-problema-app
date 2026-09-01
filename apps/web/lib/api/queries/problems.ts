'use client';

import { useMutation, useQuery, useQueryClient, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';
import type { Problem, ProblemMarker } from '@/types';
import {
  castVote as castVoteRequest,
  createProblem as createProblemRequest,
  getProblem as getProblemRequest,
  listNearbyProblems as listNearbyProblemsRequest,
  listProblems as listProblemsRequest,
  ApiError,
} from '../client';
import { USE_API } from '../../env';
import { useAuth } from '../../auth-context';

/**
 * Centralized TanStack Query hooks for the problem domain.
 *
 * These sit between the (mock-aware) `lib/api/client.ts` fetch wrapper and
 * the UI components.  Each hook:
 *   - owns its query key so cache invalidation is unambiguous
 *   - reads the Supabase access token via `useAuth()`
 *   - falls through to the in-memory mock dataset when USE_API is false
 *   - returns plain TanStack Query results so the call site keeps full
 *     control over loading / error / refetch UX
 *
 * See the docs at the top of `client.ts` for the mock / real-API split.
 */

// ----- query keys ---------------------------------------------------------

export const problemKeys = {
  all: ['problems'] as const,
  nearby: (lat: number, lng: number, radius: number) =>
    ['problems', 'nearby', { lat, lng, radius }] as const,
  list: (filters?: { category?: string; status?: string }) =>
    ['problems', 'list', filters ?? {}] as const,
  detail: (id: string) => ['problems', 'detail', id] as const,
};

// ----- useNearbyProblems --------------------------------------------------

export interface UseNearbyProblemsArgs {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  category?: string;
}

export function useNearbyProblems(
  args: UseNearbyProblemsArgs | null,
  options?: Omit<UseQueryOptions<ProblemMarker[], ApiError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  const { session } = useAuth();

  return useQuery<ProblemMarker[], ApiError>({
    queryKey: args ? problemKeys.nearby(args.latitude, args.longitude, args.radiusMeters) : ['problems', 'nearby', 'disabled'],
    queryFn: () =>
      listNearbyProblemsRequest(
        {
          latitude: args!.latitude,
          longitude: args!.longitude,
          radiusMeters: args!.radiusMeters,
          category: args!.category,
        },
        session?.access_token ?? null,
      ),
    enabled: Boolean(args),
    staleTime: 30_000,
    ...options,
  });
}

// ----- useProblemsList ----------------------------------------------------

export interface UseProblemsListArgs {
  category?: string;
  status?: string;
  institutionId?: string;
}

export function useProblemsList(
  args: UseProblemsListArgs = {},
  options?: Omit<UseQueryOptions<Problem[], ApiError>, 'queryKey' | 'queryFn'>,
) {
  const { session } = useAuth();

  return useQuery<Problem[], ApiError>({
    queryKey: problemKeys.list(args),
    queryFn: () => listProblemsRequest(args, session?.access_token ?? null),
    enabled: true,
    staleTime: 30_000,
    ...options,
  });
}

// ----- useProblem ---------------------------------------------------------

export function useProblem(
  id: string | null | undefined,
  options?: Omit<UseQueryOptions<Problem, ApiError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  const { session } = useAuth();

  return useQuery<Problem, ApiError>({
    queryKey: id ? problemKeys.detail(id) : ['problems', 'detail', 'disabled'],
    queryFn: () => getProblemRequest(id!, session?.access_token ?? null),
    enabled: Boolean(id),
    ...options,
  });
}

// ----- useCreateProblem ---------------------------------------------------

export interface CreateProblemInput {
  title: string;
  description: string;
  category: string;
  institutionId?: string | null;
  latitude: number;
  longitude: number;
}

/** Public hook — invalidates `problemKeys.all` on success. */
export function useCreateProblem() {
  const { session } = useAuth();
  const qc = useQueryClient();

  return useMutation<Problem, ApiError, CreateProblemInput>({
    mutationFn: async (input) => {
      if (!session?.access_token && USE_API) {
        throw new ApiError(401, null, 'Bejelentkezés szükséges');
      }
      return createProblemRequest(input, session?.access_token ?? 'mock-token');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: problemKeys.all });
    },
  });
}

// ----- useVote ------------------------------------------------------------

/**
 * Optimistic vote hook:
 *   - onMutate: cancel inflight detail refetch, bump cached score
 *   - onError:  roll back to the cached previous value
 *   - onSettled: invalidate so the server-authoritative score lands
 */
export function useVote(problemId: string) {
  const { session } = useAuth();
  const qc = useQueryClient();

  type Ctx = { previous?: Problem };

  return useMutation<{ score: number }, ApiError, 1 | -1, Ctx>({
    mutationFn: async (value) => {
      if (!session?.access_token && USE_API) {
        throw new ApiError(401, null, 'Bejelentkezés szükséges');
      }
      return castVoteRequest(problemId, value, session?.access_token ?? 'mock-token');
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
