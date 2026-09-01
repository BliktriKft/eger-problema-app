import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';

export default function SubmitRoute() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <View style={styles.gate} testID="submit-auth-gate">
        <Text style={styles.title}>Bejelentéshez be kell jelentkezned</Text>
        <Text style={styles.body}>
          Új pin beküldéséhez Google-, Apple- vagy Meta-fiókkal, illetve e-mail + jelszóval
          tudsz belépni.
        </Text>
        <Pressable
          onPress={() => router.replace('/(auth)/login')}
          style={styles.cta}
          testID="submit-login-cta"
        >
          <Text style={styles.ctaLabel}>Bejelentkezés</Text>
        </Pressable>
      </View>
    );
  }

  // Authenticated path: real form lives in M2.  Show a confirming placeholder
  // so QA can verify the auth gate correctly toggles.
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Új bejelentés</Text>
      <Text style={styles.body}>
        A SubmitForm komponens kész (react-hook-form + zod). A tényleges API hívás a Task M2-ben
        kerül bekötésre.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#0f172a' },
  gate: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    gap: 16,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center' },
  body: { fontSize: 14, color: '#cbd5e1', textAlign: 'center', lineHeight: 20 },
  cta: {
    marginTop: 12,
    backgroundColor: '#38bdf8',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  ctaLabel: { color: '#0f172a', fontWeight: '700', fontSize: 15 },
});
