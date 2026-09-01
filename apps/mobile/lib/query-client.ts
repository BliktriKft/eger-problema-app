import { QueryClient } from '@tanstack/react-query';

/**
 * Single QueryClient instance for the whole app.  Created lazily so tests
 * can override (e.g. with `new QueryClient({ defaultOptions: { queries: { retry: false } } })`).
 */
let client: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (client) return client;

  client = new QueryClient({
    defaultOptions: {
      queries: {
        // We aggressively retry transient network blips because RN clients on
        // flaky mobile data see them all the time — but we cap the retries
        // so the UI never gets stuck on a doomed request.
        retry: (failureCount, error) => {
          if (failureCount >= 2) return false;
          // Don't retry 4xx; they're deterministic.
          const status =
            typeof error === 'object' && error && 'status' in error
              ? (error as { status?: number }).status
              : undefined;
          if (status !== undefined && status >= 400 && status < 500) return false;
          return true;
        },
        staleTime: 30_000, // 30s — problems lists update frequently but not in real time.
        gcTime: 5 * 60_000, // 5 min — mobile memory pressure is real.
        refetchOnWindowFocus: false, // No concept of "window focus" on mobile.
      },
      mutations: {
        retry: 0, // Mutations are user-initiated — never auto-retry.
      },
    },
  });

  return client;
}
