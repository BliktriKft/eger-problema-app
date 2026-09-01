'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ShieldOff } from 'lucide-react';
import { useAuth } from './auth-context';
import { USE_API, SUPABASE_CONFIGURED } from './env';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/cn';

/**
 * useRequireAdmin — client-side admin gate.
 *
 * The Supabase `auth.users.app_metadata.role` column is the canonical
 * admin flag — set on the user via Supabase dashboard / SQL once.
 * This hook reads that flag from the live session and surfaces three
 * states:
 *
 *   - `isLoading: true`  while we wait for Supabase `getSession()` to settle
 *   - `isAllowed: true`  when the user is signed in AND marked admin
 *   - otherwise: redirects to /login (signed out) or shows a
 *     "permission denied" prompt (signed in but not admin)
 *
 * Mock mode (no Supabase / no API base) is permissive — the admin UI
 * stays browsable for QA so the surface doesn't go dark.
 */
export interface RequireAdminResult {
  isLoading: boolean;
  isAllowed: boolean;
}

function isAdmin(user: { app_metadata?: Record<string, unknown> | null } | null | undefined): boolean {
  if (!user) return false;
  const meta = (user.app_metadata ?? {}) as Record<string, unknown>;
  if (meta.role === 'admin' || meta.role === 'service_role') return true;
  if (meta.is_admin === true) return true;
  return false;
}

export function useRequireAdmin(): RequireAdminResult {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Compute the verdict unconditionally so hooks below always run.
  const isMock = !USE_API;
  const isAllowed = isMock || (isAuthenticated && isAdmin(user));

  React.useEffect(() => {
    if (isMock) return;
    if (isLoading) return;
    if (!SUPABASE_CONFIGURED) return;
    if (!isAuthenticated) {
      const next = encodeURIComponent(pathname ?? '/');
      router.replace(`/login?next=${next}`);
    }
  }, [isMock, isLoading, isAuthenticated, router, pathname]);

  return { isLoading: isLoading && SUPABASE_CONFIGURED && !isMock, isAllowed };
}

/**
 * AdminGate — wraps a client component that requires admin privileges.
 * Mirrors `AuthGate` but adds the role check on top of the auth check.
 */
export interface AdminGateProps {
  children: React.ReactNode;
}

export function AdminGate({ children }: AdminGateProps) {
  const { isLoading, isAllowed } = useRequireAdmin();
  const { user, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md p-8 text-center text-sm text-muted-foreground" data-testid="admin-gate-loading">
        Betöltés…
      </div>
    );
  }

  if (!isAllowed) {
    // Signed in but missing the admin flag.
    if (isAuthenticated && user) {
      return (
        <div className="mx-auto max-w-md p-8 text-center" data-testid="admin-gate-forbidden">
          <Card className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-destructive-50 p-3" aria-hidden>
              <ShieldOff className="size-6 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight">Nincs jogosultságod</h2>
            <p className="text-sm text-muted-foreground">
              Ez az oldal csak admin felhasználóknak érhető el. Ha szerinted ez tévedés,
              kérjük, jelezd a polgármesteri hivatalnak.
            </p>
            <a
              href="/"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              data-testid="admin-gate-home"
            >
              Vissza a főoldalra
            </a>
          </Card>
        </div>
      );
    }
    // Not signed in — AuthGate-style placeholder. The useEffect above
    // will redirect to /login once we have a stable session.
    return (
      <div className="mx-auto max-w-md p-8 text-center text-sm text-muted-foreground" data-testid="admin-gate-redirect">
        Átirányítás a bejelentkezéshez…
      </div>
    );
  }

  return <>{children}</>;
}