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

export default function RegisterRoute() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleEmailRegister() {
    if (!email || !password || !confirm) {
      Alert.alert('Hiányzó adat', 'Minden mezőt ki kell töltened.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('A két jelszó nem egyezik');
      return;
    }
    if (password.length < 8) {
      Alert.alert('A jelszó legalább 8 karakter legyen');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      Alert.alert(
        'Regisztráció kész',
        'Ellenőrizd az e-mail fiókodat a megerősítő linkért, majd jelentkezz be.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
      );
    } catch (err) {
      Alert.alert('Sikertelen regisztráció', err instanceof Error ? err.message : 'Ismeretlen hiba');
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
        <Text style={styles.heading}>Regisztráció</Text>
        <Text style={styles.subheading}>Hozd létre a fiókod és kezdj el bejelentéseket beküldeni.</Text>

        <View style={styles.formGroup}>
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
            testID="register-email"
          />
          <Text style={styles.label}>Jelszó</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="legalább 8 karakter"
            placeholderTextColor="#64748b"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            testID="register-password"
          />
          <Text style={styles.label}>Jelszó újra</Text>
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="••••••••"
            placeholderTextColor="#64748b"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            testID="register-confirm"
          />
          <Pressable
            onPress={handleEmailRegister}
            disabled={isSubmitting}
            style={[styles.cta, isSubmitting && styles.ctaPending]}
            testID="register-submit"
          >
            <Text style={styles.ctaLabel}>{isSubmitting ? 'Küldés…' : 'Regisztráció'}</Text>
          </Pressable>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>vagy</Text>
          <View style={styles.dividerLine} />
        </View>

        <OAuthButtons />

        <View style={styles.footer}>
          <Text style={styles.footerLabel}>Már van fiókod?</Text>
          <Link href="/(auth)/login" style={styles.footerLink}>
            Bejelentkezés
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
