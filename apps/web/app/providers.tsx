'use client';

import * as React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth-context';
import { getQueryClient } from '@/lib/query-client';
import { Toaster } from '@/components/ui/toaster';

/**
 * Top-level client providers.  Wrapped as a single component so the
 * root `app/layout.tsx` (a Server Component) doesn't have to pass a
 * class-instance `QueryClient` across the boundary — Next.js would
 * error with "Only plain objects…".
 *
 * See https://tanstack.com/query/latest/docs/framework/react/guides/ssr
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Lazy singleton — see `lib/query-client.ts`.
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
