import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { supabase } from '@/lib/supabase';

export default function LoginRoute() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleEmailLogin() {
    if (!email || !password) {
      Alert.alert('Hiányzó adat', 'Add meg az e-mail címet és a jelszót.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // AuthProvider's onAuthStateChange picks up the new session and the
      // root layout will Redirect us to /map.
      router.replace('/(tabs)/map');
    } catch (err) {
      Alert.alert('Sikertelen bejelentkezés', err instanceof Error ? err.message : 'Ismeretlen hiba');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.kb}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Üdv újra!</Text>
        <Text style={styles.subheading}>Jelentkezz be, hogy szavazhass és bejelentést küldhess be.</Text>

        <View style={styles.formGroup} testID="login-form">
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="te@példa.hu"
            placeholderTextColor="#64748b"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            testID="login-email"
          />
          <Text style={styles.label}>Jelszó</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#64748b"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            testID="login-password"
          />
          <Pressable
            onPress={handleEmailLogin}
            disabled={isSubmitting}
            style={[styles.cta, isSubmitting && styles.ctaPending]}
            testID="login-submit"
          >
            <Text style={styles.ctaLabel}>{isSubmitting ? 'Bejelentkezés…' : 'Bejelentkezés'}</Text>
          </Pressable>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>vagy</Text>
          <View style={styles.dividerLine} />
        </View>

        <OAuthButtons />

        <View style={styles.footer}>
          <Text style={styles.footerLabel}>Még nincs fiókod?</Text>
          <Link href="/(auth)/register" style={styles.footerLink}>
            Regisztráció
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kb: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 24, gap: 16 },
  heading: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 16 },
  subheading: { color: '#94a3b8', fontSize: 14 },
  formGroup: { gap: 8, marginTop: 12 },
  label: { color: '#cbd5e1', fontSize: 12, fontWeight: '600' },
  input: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cta: {
    backgroundColor: '#38bdf8',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaPending: { opacity: 0.6 },
  ctaLabel: { color: '#0f172a', fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#334155' },
  dividerLabel: { color: '#94a3b8', fontSize: 12 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 16 },
  footerLabel: { color: '#94a3b8', fontSize: 14 },
  footerLink: { color: '#38bdf8', fontWeight: '600' },
});
