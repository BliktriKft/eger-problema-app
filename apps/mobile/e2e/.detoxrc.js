/**
 * Detox configuration for apps/mobile.
 *
 * Two configurations target the two platforms that we actually exercise in
 * CI.  Build the apps first via:
 *
 *   pnpm --filter @eger/mobile e2e:build:ios
 *   pnpm --filter @eger/mobile e2e:build:android
 *
 * then run:
 *
 *   pnpm --filter @eger/mobile e2e:ios
 *   pnpm --filter @eger/mobile e2e:android
 *
 * The sandbox cannot drive actual iOS / Android emulators from the CI
 * container — Detox needs Xcode for iOS and a real AVD image for Android.
 * Until Task Q2 (which provisions a macOS self-hosted runner for iOS and
 * a Linux runner with KVM for Android), the e2e/ folder ships as
 * configuration + tests + a README rather than a green CI signal.
 *
 * When running on a real machine:
 *   iOS:     `xcrun simctl list devices` should show a booted iPhone 13.
 *   Android: an AVD named `Pixel_5_API_34` should be `adb`-attached.
 *
 * Refs:
 *   https://wix.github.io/Detox/docs/configuration/overview
 *   https://wix.github.io/Detox/docs/installation/expo
 */

const isAndroid = process.env.DETOX_PLATFORM === 'android';

/** Shared runtime configuration for both platforms. */
const runtimeConfig = {
  artifacts: {
    root: '.artifacts',
    plugins: {
      screenshot: 'failing',
      video: 'none',
      log: 'failing',
      instruments: 'none',
      timeline: 'none',
    },
  },
  behavior: {
    init: {
      reinstallApp: true,
      exposeGlobals: false,
    },
    cleanup: {
      shutdownDevice: false,
    },
  },
  errorRecovery: {
    haltOnFailure: true,
    recover: false,
  },
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120_000,
    },
  },
};

/** iOS sim + debug app — intended for macOS runners. */
const iosSimDebug = {
  device: {
    type: 'iPhone 13',
    bootArgs: ['-AppleLanguages=(en)', '-AppleLocale=en_US'],
  },
  app: {
    name: 'EgerProblemaApp',
    binaryPath: './ios/build/Build/Products/Debug-iphonesimulator/EgerProblemaApp.app',
  },
  configuration: 'Debug',
  scheme: 'EgerProblemaApp',
  artifacts: runtimeConfig.artifacts,
  behavior: runtimeConfig.behavior,
  errorRecovery: runtimeConfig.errorRecovery,
};

/** Android emulator + debug APK — works on Linux runners with KVM. */
const androidEmuDebug = {
  device: {
    avdName: 'Pixel_5_API_34',
    forceAdbInstall: false,
    gpuMode: 'swiftshader_indirect',
  },
  app: {
    binaryPath: './android/app/build/outputs/apk/debug/app-debug.apk',
    build:
      'cd android && ./gradlew assembleDebug assembleAndroidTest -Dproject.testBuildType=debug',
    reversePorts: [8081],
  },
  testBinaryPath: './android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk',
  artifacts: runtimeConfig.artifacts,
  behavior: runtimeConfig.behavior,
  errorRecovery: runtimeConfig.errorRecovery,
};

/** Detox config export — keys are the --configuration flag values. */
module.exports = {
  testRunner: 'jest',
  configs: {
    'ios.sim.debug': {
      ...iosSimDebug,
      testRunner: runtimeConfig.testRunner,
    },
    'android.emu.debug': {
      ...androidEmuDebug,
      testRunner: runtimeConfig.testRunner,
    },
  },
  // Allow external callers to override the config via env. Detox picks the
  // first matching key by default; switching platforms just needs the
  // matching --configuration flag.
  selectedConfiguration: isAndroid ? 'android.emu.debug' : 'ios.sim.debug',
};
