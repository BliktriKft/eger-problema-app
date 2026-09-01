/// <reference types="expo/types" />

// NOTE: This file should not be edited and should be in your git ignore
// Expo injects environment variables typed via `EXPO_PUBLIC_*` prefix.  We keep
// the ambient declarations here so TypeScript knows about them app-wide.
declare namespace NodeJS {
  interface ProcessEnv {
    readonly EXPO_PUBLIC_SUPABASE_URL?: string;
    readonly EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
    readonly EXPO_PUBLIC_API_BASE_URL?: string;
    readonly EXPO_PUBLIC_GOOGLE_CLIENT_ID?: string;
    readonly EXPO_PUBLIC_APPLE_CLIENT_ID?: string;
    readonly EXPO_PUBLIC_META_APP_ID?: string;
  }
}
