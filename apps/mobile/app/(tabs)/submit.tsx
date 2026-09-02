// apps/mobile/app/(tabs)/submit.tsx
//
// "Bejelentés" tab.  Wraps the existing `SubmitForm` (react-hook-form +
// Zod, M1) with the location picker and `useCreateProblem` mutation.
//
// Auth gate is enforced via `useRequireAuth()` — the `AuthGate`
// component renders a "jelentkezz be" CTA when the user has no session
// and `USE_API` is on.  In mock mode we let anyone submit (the demo
// still works without a backend).

import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SubmitForm, type SubmitFormValues } from '@/components/problems/SubmitForm';
import { LocationPicker, type LocationPickerValue } from '@/components/submit/LocationPicker';
import { AuthGate } from '@/lib/auth-gate';
import { useCreateProblem } from '@/lib/api/queries/problems';

export default function SubmitRoute() {
  return (
    <AuthGate reason="Új pin beküldéséhez be kell jelentkezned.">
      <SubmitBody />
    </AuthGate>
  );
}

function SubmitBody() {
  const router = useRouter();
  const [location, setLocation] = useState<LocationPickerValue | null>(null);
  const create = useCreateProblem();

  async function handleSubmit(values: SubmitFormValues) {
    if (!location) {
      Alert.alert('Hiányzó hely', 'Jelöld ki a bejelentés helyét a térképen.');
      return;
    }
    try {
      await create.mutateAsync({
        title: values.title,
        description: values.description,
        category: values.category,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      Alert.alert('Köszönjük!', 'A bejelentésed sikeresen beküldtük.', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/map'),
        },
      ]);
    } catch (err) {
      Alert.alert(
        'Beküldés sikertelen',
        err instanceof Error ? err.message : 'Ismeretlen hiba',
      );
    }
  }

  return (
    <View style={styles.container} testID="submit-screen">
      <Text style={styles.title}>Új bejelentés</Text>
      <Text style={styles.body}>
        Töltsd ki az űrlapot, jelöld meg a helyet a térképen, és küldd be a bejelentést.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Hely</Text>
        <LocationPicker value={location} onChange={setLocation} />
      </View>

      <SubmitForm
        initialLocation={location ?? { latitude: 47.9025, longitude: 20.3772 }}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#0f172a' },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  body: { color: '#94a3b8', fontSize: 13, marginTop: 4, marginBottom: 12 },
  section: { marginVertical: 12, gap: 6 },
  sectionLabel: { color: '#cbd5e1', fontSize: 12, fontWeight: '600' },
});
