import React, { useEffect } from 'react';
import { Stack, SplashScreen, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreenOriginal from 'expo-splash-screen';
import { getQueryClient } from '@/lib/query-client';
import { AuthProvider, useAuth } from '@/lib/auth-context';

// Hold the splash until the auth bootstrapping finishes — kills the
// half-second flash of the login screen on app launch.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Already shown / unsupported on web — ignore.
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Splash becomes hideable now that we know whether the user is logged in.
      SplashScreenOriginal.hideAsync().catch(() => undefined);
    }
  }, [isLoading]);

  // We don't auto-redirect here — `(tabs)/index.tsx` and `(auth)/index.tsx`
  // own navigation based on auth state, so the root layout stays agnostic.

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={getQueryClient()}>
        <AuthProvider>
          <AuthGate>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: '#0f172a' },
                headerTintColor: '#fff',
                contentStyle: { backgroundColor: '#0f172a' },
              }}
            >
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="problem/[id]"
                options={{ title: 'Probléma részletei', presentation: 'modal' }}
              />
            </Stack>
          </AuthGate>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
