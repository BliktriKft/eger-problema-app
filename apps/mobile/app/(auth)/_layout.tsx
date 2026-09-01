import React from 'react';
import { Stack } from 'expo-router';

/**
 * Auth flow navigator — login + register live here, separate from the
 * tabbed "logged in" surface so each can have its own layout & back stack.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#fff',
        contentStyle: { backgroundColor: '#0f172a' },
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Bejelentkezés' }} />
      <Stack.Screen name="register" options={{ title: 'Regisztráció' }} />
    </Stack>
  );
}
