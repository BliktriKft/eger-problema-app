'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './auth-context';
import { USE_API, SUPABASE_CONFIGURED } from './env';

/**
 * useRequireAuth — client-side auth gate.
 *
 * Returns `{ isLoading, isAllowed }` so callers can render their own
 * placeholder while we wait for the Supabase session to load, and so
 * we don't redirect twice on re-renders.  When the user is missing a
 * session AND we are running with a real backend (USE_API), we
 * redirect to /login?next=<current pathname>.
 *
 * Mock mode is permissive — auth is a no-op so the demo / QA offline
 * tests don't need real Supabase.
 */
export interface RequireAuthResult {
  isLoading: boolean;
  isAllowed: boolean;
}

export function useRequireAuth(): RequireAuthResult {
  const { session, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAllowed = USE_API ? isAuthenticated : true;

  React.useEffect(() => {
    if (isLoading) return;
    if (isAllowed) return;
    if (!SUPABASE_CONFIGURED) return; // demo mode: nothing to do
    const next = encodeURIComponent(pathname ?? '/');
    router.replace(`/login?next=${next}`);
  }, [isLoading, isAllowed, router, pathname]);

  return { isLoading: isLoading && SUPABASE_CONFIGURED, isAllowed };
}

/**
 * AuthGate — wraps a client component that requires auth and renders
 * a skeleton / branded placeholder while the session loads.  On
 * missing-auth (real API mode) it shows a one-line prompt with a link
 * to /login.
 */
export interface AuthGateProps {
  children: React.ReactNode;
  /** What we tell the user we need auth for. */
  reason?: string;
}

export function AuthGate({ children, reason }: AuthGateProps) {
  const { isLoading, isAllowed } = useRequireAuth();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md p-8 text-center text-sm text-muted-foreground" data-testid="auth-gate-loading">
        Betöltés…
      </div>
    );
  }
  if (!isAllowed) {
    return (
      <div className="mx-auto max-w-md p-8 text-center" data-testid="auth-gate-blocked">
        <p className="text-base text-foreground">
          {reason ?? 'Ehhez a művelethez be kell jelentkezned.'}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          A Google vagy Apple gombbal egy kattintás.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
