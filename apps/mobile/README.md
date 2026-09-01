# apps/mobile — iOS + Android (React Native + Expo)

A `BliktriKft/eger-problema-app` mobil alkalmazása.

## Stack

- **React Native** + **Expo SDK 51**
- **expo-router** (fájl-alapú routing)
- **react-native-maps** OSMap csempékkel
- **Supabase JS client**
- **Expo Auth Session** (OAuth flow-hoz: Google, Apple, Meta)
- **React Native Reanimated** + **Gesture Handler**
- **Detox** (E2E teszt, CI-ből futtatva)

## Könyvtárstruktúra

```
apps/mobile/
├── app/
│   ├── (auth)/              # Auth flow
│   ├── (tabs)/              # Fő navigáció
│   │   ├── map.tsx
│   │   ├── feed.tsx
│   │   └── submit.tsx
│   └── problem/[id].tsx     # Probléma részletek
├── components/
├── lib/
│   ├── supabase/
│   └── api/
├── assets/
├── ios/
└── android/
```

## Parancsok

```bash
pnpm --filter @eger/mobile start             # Expo dev server
pnpm --filter @eger/mobile ios               # iOS szimulátor
pnpm --filter @eger/mobile android           # Android emulátor
pnpm --filter @eger/mobile build:ios         # EAS Build → App Store
pnpm --filter @eger/mobile build:android     # EAS Build → Play Store
pnpm --filter @eger/mobile test:e2e          # Detox E2E
```

## Környezeti változók (apps/mobile/.env)

```
EXPO_PUBLIC_SUPABASE_URL=*** Supabase project URL>
EXPO_PUBLIC_SUPABASE_ANON_KEY=*** anon key>
EXPO_PUBLIC_API_URL=https://api.egerproblem.app
EXPO_PUBLIC_GOOGLE_CLIENT_ID=*** Google iOS/Android client ID>
EXPO_PUBLIC_APPLE_CLIENT_ID=*** Apple Services ID>
EXPO_PUBLIC_META_APP_ID=*** Facebook App ID>
```

## App Store metadata (TODO)

- Bundle ID (iOS): `hu.bliktri.egerproblemaapp`
- Package name (Android): `hu.bliktri.egerproblemaapp`
- Privacy policy URL: TBD
- Support URL: TBD
- Screenshots: 6.5" és 5.5" iOS, phone + tablet Android

## Owner

`website-mobile` agent profile (lásd: `~/.hermes/profiles/website-mobile/SOUL.md`).