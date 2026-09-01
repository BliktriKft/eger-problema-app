import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

/**
 * Auth context surface for the rest of the app.
 *
 * We deliberately do NOT expose the Supabase client itself from the context —
 * consumers that need raw access (e.g. the OAuth buttons) import `supabase`
 * directly.  This keeps the context minimal and serialisable for testing.
 */
export interface AuthContextValue {
  /** Current session (contains the access + refresh tokens). */
  session: Session | null;
  /** Convenience handle for `session.user`. */
  user: User | null;
  /** True until we've finished the initial `getSession()` call. */
  isLoading: boolean;
  /** Convenience flag — `isLoading === false && user !== null`. */
  isAuthenticated: boolean;
  /** Sign out and clear the SecureStore entry. */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let sub: { unsubscribe: () => void } | null = null;

    (async () => {
      try {
        // 1. Boot: resolve any persisted session synchronously so we don't
        //    flash the login screen on app start.
        const { data, error } = await supabase.auth.getSession();
        if (error) console.warn('[auth] getSession error', error);
        if (!cancelled) setSession(data.session ?? null);

        // 2. Subscribe so we react to sign-in, sign-out and token refresh.
        const { data: subscription } = supabase.auth.onAuthStateChange(
          (_event, newSession) => {
            if (!cancelled) setSession(newSession);
          },
        );
        sub = subscription.subscription;
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      sub?.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      isAuthenticated: !isLoading && session !== null,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, isLoading],
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
