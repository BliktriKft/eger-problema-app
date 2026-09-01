'use client';

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { Institution } from '@/types';
import {
  ApiError,
  createInstitution as createInstitutionRequest,
  deleteInstitution as deleteInstitutionRequest,
  getInstitution as getInstitutionRequest,
  listInstitutions as listInstitutionsRequest,
  updateInstitution as updateInstitutionRequest,
  type CreateInstitutionInput,
} from '../client';
import { USE_API } from '../../env';
import { useAuth } from '../../auth-context';
import { problemKeys } from './problems';

/**
 * TanStack Query hooks for the institution catalog.
 *
 * The catalog is small (< 100 rows) and almost read-only from the
 * regular user's perspective — it backs the institution autocomplete
 * on the submit form, the public browse page at /institutions, and
 * the admin CRUD surfaces at /institutions/admin*.
 *
 * For the admin mutations we lean on TanStack Query's standard
 * optimistic update pattern: snapshot the current list, push a
 * speculative row, and roll back on error.
 */

// ----- query keys ---------------------------------------------------------

export const institutionKeys = {
  all: ['institutions'] as const,
  list: (query?: { q?: string; type?: string }) =>
    ['institutions', 'list', query ?? {}] as const,
  detail: (id: string) => ['institutions', 'detail', id] as const,
};

// ----- useInstitutions ----------------------------------------------------

export interface UseInstitutionsArgs {
  /** Free-text name/address search (mapped to `search` on the wire). */
  q?: string;
  /** Restrict to one `InstitutionType` (school/hospital/pool/library/government/other). */
  type?: string;
}

export function useInstitutions(
  args: UseInstitutionsArgs = {},
  options?: Omit<UseQueryOptions<Institution[], ApiError>, 'queryKey' | 'queryFn'>,
) {
  const { session } = useAuth();
  return useQuery<Institution[], ApiError>({
    queryKey: institutionKeys.list(args),
    queryFn: () => listInstitutionsRequest(args, session?.access_token ?? null),
    staleTime: 5 * 60_000,
    ...options,
  });
}

// ----- useInstitution -----------------------------------------------------

export function useInstitution(
  id: string | null | undefined,
  options?: Omit<UseQueryOptions<Institution, ApiError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  const { session } = useAuth();
  return useQuery<Institution, ApiError>({
    queryKey: id ? institutionKeys.detail(id) : ['institutions', 'detail', 'disabled'],
    queryFn: () => getInstitutionRequest(id!, session?.access_token ?? null),
    enabled: Boolean(id),
    ...options,
  });
}

// ----- useCreateInstitution -----------------------------------------------

export type CreateInstitutionVariables = CreateInstitutionInput;

/**
 * Admin-only. Optimistically prepends the new institution to every
 * cached list so the admin list refreshes without a round-trip; on
 * error the snapshot is restored and the cache is invalidated so the
 * authoritative server state wins.
 */
export function useCreateInstitution() {
  const { session } = useAuth();
  const qc = useQueryClient();

  type Ctx = { previous?: Institution[][] };

  return useMutation<Institution, ApiError, CreateInstitutionVariables, Ctx>({
    mutationFn: async (input) => {
      if (USE_API && !session?.access_token) {
        throw new ApiError(401, null, 'Admin bejelentkezés szükséges');
      }
      return createInstitutionRequest(input, session?.access_token ?? 'mock-admin');
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: institutionKeys.all });
      const snapshot = qc.getQueriesData<Institution[]>({
        queryKey: institutionKeys.all,
      });
      const previous = snapshot.map(([key, value]) => [key, value] as [readonly unknown[], Institution[] | undefined]);
      // Optimistic record
      const optimistic: Institution = {
        id: `optimistic-${Date.now()}`,
        name: input.name,
        type: input.type,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        officialUrl: input.officialUrl,
      };
      for (const [key] of snapshot) {
        qc.setQueryData<Institution[] | undefined>(key, (current) =>
          current ? [optimistic, ...current] : current,
        );
      }
      return { previous: previous.map(([k, v]) => v ?? []) };
    },
    onError: (_err, _input, context) => {
      const previous = context?.previous;
      if (!previous) return;
      const snapshot = qc.getQueriesData<Institution[]>({
        queryKey: institutionKeys.all,
      });
      snapshot.forEach(([key], idx) => {
        qc.setQueryData(key, previous[idx]);
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: institutionKeys.all });
      qc.invalidateQueries({ queryKey: problemKeys.all });
    },
  });
}

// ----- useUpdateInstitution -----------------------------------------------

export type UpdateInstitutionVariables = { id: string } & Partial<CreateInstitutionInput>;

/**
 * Admin-only. Optimistically patches the cached detail record and
 * every cached list entry that contains the same institution.
 */
export function useUpdateInstitution() {
  const { session } = useAuth();
  const qc = useQueryClient();

  type Ctx = { previousDetail?: Institution; previousLists?: Array<[readonly unknown[], Institution[] | undefined]> };

  return useMutation<Institution, ApiError, UpdateInstitutionVariables, Ctx>({
    mutationFn: async ({ id, ...patch }) => {
      if (USE_API && !session?.access_token) {
        throw new ApiError(401, null, 'Admin bejelentkezés szükséges');
      }
      return updateInstitutionRequest(id, patch, session?.access_token ?? 'mock-admin');
    },
    onMutate: async ({ id, ...patch }) => {
      await qc.cancelQueries({ queryKey: institutionKeys.all });
      const previousDetail = qc.getQueryData<Institution>(institutionKeys.detail(id));
      if (previousDetail) {
        qc.setQueryData<Institution>(institutionKeys.detail(id), { ...previousDetail, ...patch });
      }
      const snapshot = qc.getQueriesData<Institution[]>({ queryKey: institutionKeys.all });
      const previousLists = snapshot.map(([key, value]) => [key, value] as [readonly unknown[], Institution[] | undefined]);
      for (const [key, value] of snapshot) {
        if (!value) continue;
        qc.setQueryData<Institution[] | undefined>(key, value.map((row) => (row.id === id ? { ...row, ...patch } : row)));
      }
      return { previousDetail, previousLists };
    },
    onError: (_err, vars, context) => {
      if (context?.previousDetail) {
        qc.setQueryData(institutionKeys.detail(vars.id), context.previousDetail);
      }
      if (context?.previousLists) {
        for (const [key, value] of context.previousLists) {
          qc.setQueryData(key, value);
        }
      }
    },
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: institutionKeys.all });
      qc.invalidateQueries({ queryKey: institutionKeys.detail(vars.id) });
    },
  });
}

// ----- useDeleteInstitution -----------------------------------------------

/**
 * Admin-only. Optimistically removes the institution from every cached
 * list and detail slot; rollback on error.
 */
export function useDeleteInstitution() {
  const { session } = useAuth();
  const qc = useQueryClient();

  type Ctx = { previousDetail?: Institution; previousLists?: Array<[readonly unknown[], Institution[] | undefined]> };

  return useMutation<void, ApiError, { id: string }, Ctx>({
    mutationFn: async ({ id }) => {
      if (USE_API && !session?.access_token) {
        throw new ApiError(401, null, 'Admin bejelentkezés szükséges');
      }
      await deleteInstitutionRequest(id, session?.access_token ?? 'mock-admin');
    },
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: institutionKeys.all });
      const previousDetail = qc.getQueryData<Institution>(institutionKeys.detail(id));
      qc.removeQueries({ queryKey: institutionKeys.detail(id) });
      const snapshot = qc.getQueriesData<Institution[]>({ queryKey: institutionKeys.all });
      const previousLists = snapshot.map(([key, value]) => [key, value] as [readonly unknown[], Institution[] | undefined]);
      for (const [key, value] of snapshot) {
        if (!value) continue;
        qc.setQueryData<Institution[] | undefined>(key, value.filter((row) => row.id !== id));
      }
      return { previousDetail, previousLists };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousDetail) {
        // The previousDetail has been removed from the cache already;
        // re-set it.
        const detailKey = institutionKeys.detail(context.previousDetail.id);
        qc.setQueryData(detailKey, context.previousDetail);
      }
      if (context?.previousLists) {
        for (const [key, value] of context.previousLists) {
          qc.setQueryData(key, value);
        }
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: institutionKeys.all });
      qc.invalidateQueries({ queryKey: problemKeys.all });
    },
  });
}