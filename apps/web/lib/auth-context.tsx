'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getBrowserSupabase } from './supabase/client';
import { ENV } from './env';

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
  /**
   * App-level role read from `public.users.role` by the backend on
   * every verifyToken() call. Defaults to 'user' until the first
   * `/api/auth/me` round-trip completes. Used by the admin gate
   * (lib/admin-gate.tsx) and by the Admin link in TopNav to decide
   * whether to show the institutions admin pages.
   */
  appRole: 'user' | 'moderator' | 'admin';
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = getBrowserSupabase();
  const isConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

  const [session, setSession] = useState<Session | null>(null);
  const [appRole, setAppRole] = useState<'user' | 'moderator' | 'admin'>('user');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let sub: { unsubscribe: () => void } | null = null;

    if (!isConfigured) {
      // Skip the Supabase round-trip when envs are missing.
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.warn('[auth] getSession error', error);
        if (!cancelled) setSession(data.session ?? null);

        // Fetch the caller's app role from the NestJS backend.
        // /api/auth/me returns { id, email, appRole } and the JwtAuthGuard
        // populates appRole from public.users.role. We refresh it every
        // time the session changes; the value is then available via
        // useAuth().appRole to <AdminGate /> and <TopNav />.
        const token = data.session?.access_token;
        if (token) {
          try {
            const res = await fetch(`${ENV.apiBaseUrl}/api/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
              cache: 'no-store',
            });
            if (res.ok) {
              const me = (await res.json()) as { appRole?: 'user' | 'moderator' | 'admin' };
              if (!cancelled && me.appRole) setAppRole(me.appRole);
            }
          } catch {
            // Network failure is fine — appRole stays 'user' which is
            // the correct safe default.
          }
        }

        const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
          if (!cancelled) setSession(newSession);
          // Re-fetch app role on any session change (sign-in / token refresh).
          const t = newSession?.access_token;
          if (t) {
            fetch(`${ENV.apiBaseUrl}/api/auth/me`, {
              headers: { Authorization: `Bearer ${t}` },
              cache: 'no-store',
            })
              .then((r) => (r.ok ? r.json() : null))
              .then((me: { appRole?: 'user' | 'moderator' | 'admin' } | null) => {
                if (!cancelled && me?.appRole) setAppRole(me.appRole);
              })
              .catch(() => {/* keep previous appRole */});
          } else if (!cancelled) {
            setAppRole('user');
          }
        });
        sub = subscription.subscription;
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      sub?.unsubscribe();
    };
  }, [isConfigured, supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      isAuthenticated: !isLoading && session !== null,
      isConfigured,
      appRole,
      signOut: async () => {
        if (!isConfigured) return;
        await supabase.auth.signOut();
      },
    }),
    [session, isLoading, isConfigured, appRole, supabase],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return ctx;
}
