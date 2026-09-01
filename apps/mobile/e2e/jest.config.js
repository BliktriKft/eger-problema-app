/**
 * Detox's jest config — bound to the `e2e/tests/*.test.ts` files.
 *
 * We use ts-jest to compile the TS sources against the same @types the
 * app uses, so test bodies get auto-completion for `byTestId()` and the
 * rest of the device helpers.
 *
 * `globalSetup: './setup'` boots the Metro / Expo bundle once for the
 * whole run.  `globalTeardown` cleans up the simulator / emulator state.
 */

module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/tests/**/*.test.ts'],
  testTimeout: 120_000,
  maxWorkers: 1,
  setupFiles: ['<rootDir>/e2e/jest.setup.js'],
  preset: 'ts-jest',
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: '.artifacts/junit', outputName: 'detox.xml' }],
  ],
};
