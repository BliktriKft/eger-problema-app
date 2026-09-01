#!/usr/bin/env python3
"""
Open (or reuse) a PR for mobile/0001-expo-shell-auth-map and merge it to main.

Self-merges per MVP-phase policy (no required reviewer).  Mirrors the
architect-side scripts/arch-merge-0001.py so the operational ritual is
identical across profiles.
"""
import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

ENV_PATH = Path("/home/bliktri/.hermes/profiles/website-mobile/.env")
HEAD = "mobile/0001-expo-shell-auth-map"
BASE = "main"
PR_TITLE = "mobile: Expo SDK 51 shell + Supabase auth + OSMap react-native-maps (#2)"
PR_BODY = """Task 0001-M — Expo SDK 51 + expo-router + react-native-maps shell with
Supabase auth (expo-secure-store backed) wired in. Stubs only — M2 will
implement the real Problem CRUD and voting flows against the NestJS API
that the architect cut in #1.

**Deliverables**
- `apps/mobile/package.json` — Expo SDK 51, RN 0.74.5, expo-router 3.5,
  react-native-maps 1.14, @supabase/supabase-js 2.45, TanStack Query 5,
  react-hook-form, zod, expo-secure-store, expo-auth-session, expo-location,
  expo-image-picker, expo-notifications.
- `apps/mobile/metro.config.js` — monorepo-aware (watchFolders +
  nodeModulesPaths + symlink/package-exports support) so pnpm-workspace
  resolution works for `@eger/shared`.
- `apps/mobile/app.json` — bundle id `ai.bliktri.egerproblem`, scheme
  `egerproblem`, plugins for `expo-router`, `expo-secure-store`,
  `expo-location`, `expo-image-picker`, `expo-notifications`. Required
  iOS / Android permission strings inlined.
- `apps/mobile/eas.json` — `development` / `preview` / `production`
  profiles with `appVersionSource: remote` and `runtimeVersion.policy:
  appVersion`.
- `apps/mobile/.env.example` — public Expo env vars only
  (`EXPO_PUBLIC_*`). Notes that server-only secrets belong in EAS Secrets.
- `apps/mobile/lib/supabase.ts` — singleton client, `ExpoSecureStore`
  storage adapter (Keychain on iOS, EncryptedSharedPreferences on
  Android), namespaced by `supabase-` prefix.
- `apps/mobile/lib/auth-context.tsx` — `AuthProvider` + `useAuth()` hook,
  mirrors session via `onAuthStateChange`, exposes `signOut`.
- `apps/mobile/lib/api.ts` — typed `api<T>()` fetch wrapper, attaches
  current Supabase access token as Bearer header on every request.
- `apps/mobile/lib/query-client.ts` — singleton `QueryClient` with
  sensible retry policy (no auto-retry on 4xx, cap at 2 attempts).
- `apps/mobile/components/map/MapScreen.tsx` — `<MapView provider={null}>`
  with `UrlTile` overlay (`{s}.tile.openstreetmap.org`), expo-location
  permission flow, Eger fallback centre.
- `apps/mobile/components/map/ProblemPin.tsx` — coloured pin with
  score/category/status, hung off `<Marker>` via `anchor={{x: 0.5, y: 1}}`.
- `apps/mobile/components/auth/OAuthButtons.tsx` — Supabase
  `signInWithOAuth` for Google/Apple/Meta, opens in
  `expo-web-browser`'s `openAuthSessionAsync` and returns to
  `egerproblem://auth/callback`.
- `apps/mobile/components/voting/VoteButtons.tsx` — M2 hook component
  (optimistic toggle, wired callback).
- `apps/mobile/components/problems/ProblemCard.tsx` — list cell.
- `apps/mobile/components/problems/SubmitForm.tsx` — react-hook-form +
  Zod validation; onSubmit prop wired for M2.
- `apps/mobile/app/_layout.tsx` — root: `SafeAreaProvider` →
  `QueryClientProvider` → `AuthProvider` → `AuthGate` → `Stack` with
  `(auth)`, `(tabs)`, and modal `problem/[id]`.
- `apps/mobile/app/index.tsx` — decides `(auth)/login` vs `(tabs)/map`
  based on auth state.
- `apps/mobile/app/(auth)/_layout.tsx`, `login.tsx`, `register.tsx` —
  email/password + OAuth buttons + footer link.
- `apps/mobile/app/(tabs)/_layout.tsx`, `map.tsx`, `feed.tsx`,
  `submit.tsx` — three tabs; `submit` has an auth gate.
- `apps/mobile/app/problem/[id].tsx` — detail screen with sample data
  for QA.

**Verification**
- `pnpm --filter @eger/mobile install` resolves cleanly.
- `pnpm --filter @eger/mobile typecheck` (tsc --noEmit) passes against
  the strict TS settings (see Status log for actual run output).

**Out of scope (M2 / M3)**
- Real Problem CRUD mutation + voting RPC against the NestJS API.
- Detox E2E test scaffold + EAS Build first run.
- Migration of StyleSheet hex literals to `@eger/design` tokens
  (`apps/mobile/src/theme/tokens.ts` already exists but is not yet
  imported anywhere — flagged as M3 work).

**Risks / known issues**
- Bundle ID is `ai.bliktri.egerproblem` per the task plan; SOUL.md
  previously mentioned `hu.bliktri.egerproblemaapp`. If product wants
  the SOUL.md value, easy 1-line patch + EAS project update.
- `app.json` extras.eas.projectId is `TBD` until first `eas init`.
- `submit.production` block in `eas.json` has placeholder `ascAppId` /
  `appleTeamId`. Required before App Store submission (M1.5 territory).
"""


def load_env():
    env = {}
    if not ENV_PATH.exists():
        return env
    for line in ENV_PATH.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def api(method, url, token, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"token {token}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("User-Agent", "website-mobile")
    if body is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            payload = resp.read().decode()
            return resp.status, json.loads(payload) if payload else {}
    except urllib.error.HTTPError as e:
        payload = e.read().decode()
        try:
            return e.code, json.loads(payload)
        except Exception:
            return e.code, {"raw": payload}


def main():
    env = load_env()
    token = env.get("GITHUB_TOKEN")
    repo = env.get("GITHUB_REPO")
    if not token or not repo:
        print(
            f"missing GITHUB_TOKEN or GITHUB_REPO in {ENV_PATH}",
            file=sys.stderr,
        )
        sys.exit(2)

    api_base = "https://api.github.com"
    # 1. Reuse existing PR if it exists, otherwise create one.
    status, lst = api(
        "GET",
        f"{api_base}/repos/{repo}/pulls?state=open&head=BliktriKft:{HEAD}",
        token,
    )
    if status != 200:
        print(f"list PRs failed: HTTP {status} {lst}", file=sys.stderr)
        sys.exit(1)
    if lst:
        pr = lst[0]
        print(f"PR already exists: #{pr['number']} {pr['html_url']}")
    else:
        status, pr = api(
            "POST",
            f"{api_base}/repos/{repo}/pulls",
            token,
            {
                "title": PR_TITLE,
                "head": HEAD,
                "base": BASE,
                "body": PR_BODY,
            },
        )
        if status not in (200, 201):
            print(
                f"create PR failed: HTTP {status} {json.dumps(pr, indent=2)}",
                file=sys.stderr,
            )
            sys.exit(1)
        print(f"PR opened: #{pr['number']} {pr['html_url']}")

    pr_number = pr["number"]
    # 2. Merge (squash) per MVP policy.
    status, merged = api(
        "PUT",
        f"{api_base}/repos/{repo}/pulls/{pr_number}/merge",
        token,
        {
            "merge_method": "squash",
            "commit_title": f"mobile: Expo SDK 51 shell + Supabase auth + OSMap react-native-maps (#{pr_number})",
        },
    )
    if status not in (200, 201):
        print(
            f"merge failed: HTTP {status} {json.dumps(merged, indent=2)}",
            file=sys.stderr,
        )
        sys.exit(1)
    print(f"PR merged: {merged.get('sha', '?')} message={merged.get('message', '?')}")


if __name__ == "__main__":
    main()
