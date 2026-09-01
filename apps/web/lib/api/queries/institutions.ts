'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { Institution } from '@/types';
import { listInstitutions as listInstitutionsRequest, ApiError } from '../client';
import { institutionKeys } from './problems';
import { useAuth } from '../../auth-context';

/**
 * useInstitutions — fetches the (small) institution catalog. Used by the
 * submit-form autocomplete.  Backed by GET /api/institutions.
 */
export function useInstitutions(
  query: { q?: string; type?: string } = {},
  options?: Omit<UseQueryOptions<Institution[], ApiError>, 'queryKey' | 'queryFn'>,
) {
  const { session } = useAuth();

  return useQuery<Institution[], ApiError>({
    queryKey: institutionKeys.list(query),
    queryFn: () => listInstitutionsRequest(query, session?.access_token ?? null),
    staleTime: 5 * 60_000,
    ...options,
  });
}
