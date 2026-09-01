import { QueryClient } from '@tanstack/react-query';

/**
 * Single shared QueryClient (created lazily so tests can stub it).
 *
 * We are deliberately optimistic on retries for transient errors but
 * bail out on 4xx — see the same trade-off documented on mobile.
 */
let client: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (client) return client;

  client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (failureCount >= 2) return false;
          const status =
            typeof error === 'object' && error && 'status' in error
              ? (error as { status?: number }).status
              : undefined;
          if (status !== undefined && status >= 400 && status < 500) return false;
          return true;
        },
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });

  return client;
}
