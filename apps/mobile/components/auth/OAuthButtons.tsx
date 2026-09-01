import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';

// Required by `expo-auth-session` so the auth result lands back in the app.
WebBrowser.maybeCompleteAuthSession();

type OAuthProvider = 'google' | 'apple' | 'facebook';

interface ProviderSpec {
  id: OAuthProvider;
  label: string;
  emoji: string;
  background: string;
  textColor: string;
}

const PROVIDERS: ReadonlyArray<ProviderSpec> = [
  { id: 'google', label: 'Google', emoji: 'G', background: '#ffffff', textColor: '#1f2937' },
  { id: 'apple', label: 'Apple', emoji: '', background: '#000000', textColor: '#ffffff' },
  { id: 'facebook', label: 'Meta', emoji: 'f', background: '#1877f2', textColor: '#ffffff' },
];

/**
 * OAuth buttons for Google / Apple / Meta.
 *
 * We use Supabase's `signInWithOAuth` which itself returns a `url`+`code`
 * pair — `expo-auth-session` opens that URL in the system browser (or ASWeb
 * Authentication Session on iOS), and the redirect back to `egerproblem://`
 * carries the implicit auth code.  Supabase then swaps it for a session.
 */
export function OAuthButtons() {
  const [pending, setPending] = React.useState<OAuthProvider | null>(null);

  async function handle(provider: OAuthProvider) {
    setPending(provider);
    try {
      const redirectTo = makeRedirectUri({ scheme: 'egerproblem', path: 'auth/callback' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider === 'facebook' ? 'facebook' : provider,
        options: {
          redirectTo,
          // No PKCE here — Supabase already handles code+verifier exchange.
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('Nincs OAuth URL a Supabase válaszban');
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === 'success' && result.url) {
        // Supabase picks up the session via onAuthStateChange in AuthProvider.
        // Nothing to do here — but we keep this branch explicit so future
        // logging/tracking hooks have a place to hang.
      }
    } catch (err) {
      console.warn('[oauth] sign-in failed', err);
    } finally {
      setPending(null);
    }
  }

  return (
    <View style={styles.container} testID="oauth-buttons">
      {PROVIDERS.map((p) => (
        <Pressable
          key={p.id}
          accessibilityRole="button"
          accessibilityLabel={`${p.label} fiókkal bejelentkezés`}
          onPress={() => handle(p.id)}
          disabled={pending !== null}
          style={[
            styles.button,
            { backgroundColor: p.background },
            pending === p.id && styles.buttonPending,
          ]}
          testID={`oauth-${p.id}`}
        >
          {pending === p.id ? (
            <ActivityIndicator color={p.textColor} />
          ) : (
            <>
              <Text style={[styles.emoji, { color: p.textColor }]}>{p.emoji}</Text>
              <Text style={[styles.label, { color: p.textColor }]}>{p.label} folytatás</Text>
            </>
          )}
        </Pressable>
      ))}
    </View>
  );
}

// `useAuthRequest` reference is imported for future use (e.g. when we wire
// explicit PKCE-protected flows outside Supabase).  Keep the import here so
// tree-shakers see the dep is real and Metro doesn't strip the auth-session
// module prematurely.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _keepHook = useAuthRequest;

const styles = StyleSheet.create({
  container: { gap: 10 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 10,
  },
  buttonPending: { opacity: 0.7 },
  emoji: { fontSize: 16, fontWeight: '700', width: 18, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600' },
});
