// apps/mobile/lib/auth-gate.tsx
//
// expo-router-friendly auth gate.  Mirrors the web app's `useRequireAuth` /
// `AuthGate` (apps/web/lib/auth-gate.tsx) but uses `expo-router`'s
// `useRouter()` for navigation.
//
// Mock mode (USE_MOCK) is permissive — auth is a no-op so the demo /
// QA offline tests don't need real Supabase.

import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './auth-context';
import { SUPABASE_CONFIGURED, USE_API } from './env';

export interface RequireAuthResult {
  isLoading: boolean;
  isAllowed: boolean;
}

/**
 * Hook form.  Returns `{ isLoading, isAllowed }` so callers can render
 * their own placeholder while the Supabase session loads.
 */
export function useRequireAuth(): RequireAuthResult {
  const { isLoading, isAuthenticated } = useAuth();

  const isAllowed = USE_API ? isAuthenticated : true;
  return {
    isLoading: isLoading && SUPABASE_CONFIGURED,
    isAllowed,
  };
}

export interface AuthGateProps {
  children: ReactNode;
  /** What we tell the user we need auth for. */
  reason?: string;
}

/**
 * Component form.  Wraps any auth-required screen.  While the session
 * loads we render a tiny placeholder; on missing-auth (real API mode)
 * we show a one-tap CTA that pushes the user back to /login.
 */
export function AuthGate({ children, reason }: AuthGateProps) {
  const router = useRouter();
  const { isLoading, isAllowed } = useRequireAuth();

  if (isLoading) {
    return (
      <View style={styles.center} testID="auth-gate-loading">
        <Text style={styles.muted}>Betöltés…</Text>
      </View>
    );
  }
  if (!isAllowed) {
    return (
      <View style={styles.center} testID="auth-gate-blocked">
        <Text style={styles.title}>{reason ?? 'Ehhez a művelethez be kell jelentkezned.'}</Text>
        <Text style={styles.muted}>A Google vagy Apple gombbal egy kattintás.</Text>
        <Pressable
          onPress={() => router.replace('/(auth)/login')}
          style={styles.cta}
          testID="auth-gate-login-cta"
        >
          <Text style={styles.ctaLabel}>Bejelentkezés</Text>
        </Pressable>
      </View>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    gap: 12,
  },
  title: { color: '#fff', fontSize: 16, textAlign: 'center' },
  muted: { color: '#94a3b8', fontSize: 13, textAlign: 'center' },
  cta: {
    marginTop: 8,
    backgroundColor: '#38bdf8',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  ctaLabel: { color: '#0f172a', fontWeight: '700', fontSize: 14 },
});
