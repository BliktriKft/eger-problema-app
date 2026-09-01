import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

/**
 * Supabase session storage backed by `expo-secure-store`.
 *
 * Tokens never land in AsyncStorage: SecureStore uses the iOS Keychain and
 * Android EncryptedSharedPreferences under the hood.  Each entry is namespaced
 * by a (per-project) prefix so multiple Expo apps on the same simulator don't
 * stomp each other.
 *
 * Mirrors the pattern documented at
 *   https://supabase.com/docs/guides/auth/auth-helpers/react-native
 */
// Note: we declare an explicit Supabase-compatible Storage shape here instead
// of importing `Storage` from the DOM lib — react-native has no `Storage`.
//
// Supabase v2 expects:
//   { getItem: (key) => Promise<string|null>, setItem: (key, value) => Promise<void>, removeItem: (key) => Promise<void> }
// (NOT the synchronous Web `Storage` interface.)
interface AsyncStorageLike {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

class ExpoSecureStoreAdapter implements AsyncStorageLike {
  constructor(private readonly prefix: string) {}

  private key(key: string): string {
    return `${this.prefix}-${key}`;
  }

  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.key(key));
    } catch (err) {
      // SecureStore throws on simulator without a provisioning profile, etc.
      // We swallow so the app still boots in degraded mode and the user can
      // re-login from the UI.  Log to console for diagnostics.
      console.warn('[supabase/storage] getItem failed', { key, err });
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.key(key), value);
    } catch (err) {
      console.warn('[supabase/storage] setItem failed', { key, err });
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.key(key));
    } catch (err) {
      console.warn('[supabase/storage] removeItem failed', { key, err });
    }
  }
}

/**
 * Project-wide Supabase client.
 *
 * Initialised eagerly with the public anon key — this is safe because Supabase
 * relies on Postgres RLS for server-side enforcement (see ADR-0004).  Real
 * secrets (service role keys, signing keys) live server-side only.
 */
function buildSupabaseClient(): SupabaseClient {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? Constants.expoConfig?.extra?.supabaseUrl;
  const anonKey =
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? Constants.expoConfig?.extra?.supabaseAnonKey;

  if (!url || !anonKey) {
    // Don't crash the bundle — the auth screens render a "configure me" state
    // when these are missing.  Log loudly so devs notice.
    console.warn(
      '[supabase] EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is missing — auth flows will not work until you populate apps/mobile/.env',
    );
  }

  return createClient(url ?? 'https://placeholder.supabase.co', anonKey ?? 'placeholder', {
    auth: {
      storage: new ExpoSecureStoreAdapter('supabase'),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Expo Router handles deep links explicitly.
    },
  });
}

export const supabase: SupabaseClient = buildSupabaseClient();
