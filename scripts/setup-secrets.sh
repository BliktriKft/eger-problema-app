#!/bin/bash
# Eger Város Probléma Térkép — token bekötő script
# Futtatás: bash setup-secrets.sh (vagy ./setup-secrets.sh ha chmod +x)
# Futtassa: bliktri user (NE root!)
set -euo pipefail

echo "=== Eger Város Probléma Térkép — secret bekötés ==="
echo "(A tokenek nem echo-lódnak vissza, és nem kerülnek shell history-ba.)"
echo ""

# --- 1. Tokenek beolvasása (interaktív, secure) ---
read -rp "Supabase project URL (pl. https://xxx.supabase.co): " SUPABASE_URL
read -rsp "Supabase service_role key (server-only, hosszú, jwt-token): " SUPABASE_SERVICE_ROLE_KEY
echo
read -rsp "Supabase anon key (public, safe, jwt-token): " SUPABASE_ANON_KEY
echo
read -rp "Google OAuth Client ID (web): " GOOGLE_OAUTH_WEB_ID
read -rsp "Google OAuth Client Secret: " GOOGLE_OAUTH_CLIENT_SECRET
echo
read -rp "Google OAuth Client ID (iOS) — hagyd üresen ha kihagyod: " GOOGLE_OAUTH_IOS_ID
read -rp "Google OAuth Client ID (Android) — hagyd üresen ha kihagyod: " GOOGLE_OAUTH_ANDROID_ID
echo
echo ""

# --- 2. Validáció: minden kötelező token jelen van-e ---
# A GOOGLE_NEWS_API_KEY most kimarad (V2 fázisban kötjük be, amikor a wiki modul élesbe megy).
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] || [ -z "$SUPABASE_ANON_KEY" ] || \
   [ -z "$GOOGLE_OAUTH_WEB_ID" ] || [ -z "$GOOGLE_OAUTH_CLIENT_SECRET" ]; then
  echo "HIBA: kötelező token hiányzik. Kilépek." >&2
  exit 1
fi

# --- 3. .env fájlok kezelése ---
# Korábbi tartalom megőrzése (GITHUB_TOKEN bent marad), csak hozzáfűzés.
# Ha kétszer futtatod, duplikált sorok keletkeznek — figyelj erre!
API_ENV=/home/bliktri/.hermes/profiles/website-architect/.env
WEB_ENV=/home/bliktri/.hermes/profiles/website-frontend/.env
MOBILE_ENV=/home/bliktri/.hermes/profiles/website-mobile/.env
AI_ENV=/home/bliktri/.hermes/profiles/website-ai/.env

# --- 4. apps/api profile (architect + ai közös .env — az API egyetlen NestJS process) ---
# Architect írja a NestJS-t, AI írja a wiki/scraper modulokat, mindkettő ugyanazt a .env-t olvassa.
touch "$API_ENV"
chmod 600 "$API_ENV"
cat >> "$API_ENV" <<EOF
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
GOOGLE_OAUTH_CLIENT_SECRET=$GOOGLE_OAUTH_CLIENT_SECRET
# GOOGLE_NEWS_API_KEY kimarad (V2 fázisban kötjük be)
EOF
chown bliktri:bliktri "$API_ENV"
chmod 600 "$API_ENV"

# --- 5. apps/web profile (frontend, Next.js) ---
touch "$WEB_ENV"
chmod 600 "$WEB_ENV"
cat >> "$WEB_ENV" <<EOF
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=$GOOGLE_OAUTH_WEB_ID
GOOGLE_OAUTH_CLIENT_SECRET=$GOOGLE_OAUTH_CLIENT_SECRET
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
chown bliktri:bliktri "$WEB_ENV"
chmod 600 "$WEB_ENV"

# --- 6. apps/mobile profile (React Native + Expo) ---
touch "$MOBILE_ENV"
chmod 600 "$MOBILE_ENV"
cat >> "$MOBILE_ENV" <<EOF
EXPO_PUBLIC_SUPABASE_URL=$SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EXPO_PUBLIC_GOOGLE_CLIENT_ID=$GOOGLE_OAUTH_WEB_ID
EXPO_PUBLIC_API_URL=https://api.egerproblem.app
EOF
if [ -n "$GOOGLE_OAUTH_IOS_ID" ]; then
  echo "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=$GOOGLE_OAUTH_IOS_ID" >> "$MOBILE_ENV"
fi
if [ -n "$GOOGLE_OAUTH_ANDROID_ID" ]; then
  echo "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=$GOOGLE_OAUTH_ANDROID_ID" >> "$MOBILE_ENV"
fi
chown bliktri:bliktri "$MOBILE_ENV"
chmod 600 "$MOBILE_ENV"

# --- 7. apps/api wiki/scraper sub-config (ai profile külön .env) ---
# Az architect .env-jében is benne van, de az ai profile külön kapja,
# hogy ha csak az ai restartol, ne kelljen a teljes API .env-t újraolvasni.
touch "$AI_ENV"
chmod 600 "$AI_ENV"
cat >> "$AI_ENV" <<EOF
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
# GOOGLE_NEWS_API_KEY kimarad (V2 fázisban kötjük be)
EOF
chown bliktri:bliktri "$AI_ENV"
chmod 600 "$AI_ENV"

# --- 8. Eredmény ---
echo ""
echo "KÉSZ. Bekötött .env fájlok:"
ls -la "$API_ENV" "$WEB_ENV" "$MOBILE_ENV" "$AI_ENV"
echo ""
echo "Tartalom ellenőrzése (REDACTED, csak a kulcsneveket mutatja):"
for f in "$API_ENV" "$WEB_ENV" "$MOBILE_ENV" "$AI_ENV"; do
  echo "--- $f ---"
  if [ -f "$f" ]; then
    cut -d= -f1 "$f" | sed 's/^/  /'
  fi
done