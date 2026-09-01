import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '@/lib/auth-context';

/**
 * Bare entry route.  Decides where to send the user based on session state.
 *   - not authenticated → /login
 *   - authenticated    → /map
 *
 * Returning `<Redirect />` from expo-router is cheap and triggers an
 * instantaneous client-side navigation, no server hop.
 */
export default function Index() {
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // No-op — just here so future analytics hooks can hook into "first paint".
  }, []);

  if (isLoading) {
    return <View />; // Splash overlay is shown; placeholder keeps layout stable.
  }
  return <Redirect href={isAuthenticated ? '/(tabs)/map' : '/(auth)/login'} />;
}
