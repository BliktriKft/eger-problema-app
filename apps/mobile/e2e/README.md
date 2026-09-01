# apps/mobile/e2e — Detox setup

End-to-end tests for the Expo mobile app, driven by [Detox](https://wix.github.io/Detox/).
The sandbox container cannot drive iOS simulators (no Xcode) or Android
emulators (no KVM) so this folder ships as *configuration + tests* only
today — actual CI runs land in Task Q2 once a macOS runner (iOS) and a
Linux runner with KVM (Android) are wired up.

## Layout

```
e2e/
├── .detoxrc.js             # device + app config (ios.sim.debug + android.emu.debug)
├── jest.config.js          # Jest as Detox test runner, ts-jest preset
├── jest.setup.js           # locale + timezone pinned to hu-HU / Europe/Budapest
├── tests/
│   ├── auth.test.ts        # login screen renders, OAuth button present
│   ├── map.test.ts         # map screen mounts, demo pins
│   ├── feed.test.ts        # problem cards in the FlatList, tap → detail
│   └── submit.test.ts      # auth-gate CTA when signed out
└── README.md               # this file
```

## Running locally

The mobile app uses Expo SDK 51. To produce the binary that Detox drives,
you need a fully prebuilt native project (`expo prebuild`):

```bash
pnpm --filter @eger/mobile prebuild
```

That creates `apps/mobile/ios/` and `apps/mobile/android/`. From there:

### iOS (macOS only)

```bash
# Boot a sim once; future runs reuse it
xcrun simctl boot 'iPhone 13' || true
pnpm --filter @eger/mobile e2e:build:ios      # xcodebuild Debug-iphonesimulator
pnpm --filter @eger/mobile e2e:ios            # detox test --configuration ios.sim.debug
```

### Android (Linux + KVM, or macOS)

```bash
# Pixel 5 API 34 AVD must exist
emulator -avd Pixel_5_API_34 &
adb wait-for-device
pnpm --filter @eger/mobile e2e:build:android  # ./gradlew assembleDebug assembleAndroidTest
pnpm --filter @eger/mobile e2e:android        # detox test --configuration android.emu.debug
```

## CI strategy

- The macOS self-hosted runner (Task Q2 ops thread) takes the
  `e2e:ios` job.  Runs the same Node 20 + pnpm 9 setup as the web CI.
- The Linux runner (with KVM) takes the `e2e:android` job — KVM is
  required because the Detox Gradle plugin needs to push an instrumented
  APK to the emulator.
- A single `./scripts/ci-mobile-e2e.sh` wrapper picks the right
  configuration from the runner's label.

## Why tests depend on `testID`

Every `testID="…"` attribute in `apps/mobile/app/**/*.tsx` and
`components/` is a contract that the Detox suite relies on. If you
rename one, `e2e/tests/*.test.ts` will need to update in the same commit.
See `docs/qa/README.md` for the POM + testID convention.

## Known limitations

- The Expo dev client (the typical Detox target for SDK 51) requires
  `expo-dev-client`.  If you see "Detox cannot find the app", run
  `pnpm --filter @eger/mobile prebuild` and rebuild.
- Detox's iOS driver expects *one* booted simulator per run. Avoid
  parallel Detox runs on the same macOS host.
- Android API 34 image (~700 MB) is *not* cached by Detox; expect a long
  cold-start on the first job in a given CI runner image.

When you're ready to wire a green Detox signal into GitHub Actions, the
`qa.yml` workflow (Task Q2) will get a new job that consumes this
folder.
