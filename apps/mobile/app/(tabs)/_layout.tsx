import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

/**
 * Three-tab navigator: map / feed / submit.
 *
 * `submit` is the heaviest tab — it requires auth, so users without a session
 * land on the screen-local overlay that prompts them to log in (instead of
 *  we bounce them away from the tab entirely).
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#38bdf8',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { backgroundColor: '#0f172a', borderTopColor: '#1e293b' },
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: 'Térkép',
          tabBarIcon: ({ color }) => <TabIcon glyph="M" color={color} />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Lista',
          tabBarIcon: ({ color }) => <TabIcon glyph="L" color={color} />,
        }}
      />
      <Tabs.Screen
        name="submit"
        options={{
          title: 'Bejelentés',
          tabBarIcon: ({ color }) => <TabIcon glyph="+" color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ glyph, color }: { glyph: string; color: string }) {
  return <Text style={{ color, fontSize: 18, fontWeight: '700' }}>{glyph}</Text>;
}
