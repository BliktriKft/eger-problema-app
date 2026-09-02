/**
 * Jest config for the in-process unit tests under `apps/mobile/lib/__smoke__/`.
 *
 * Mirrors the structure of `e2e/jest.config.js` but stays in-process —
 * no Detox runtime, just ts-jest.  Run via:
 *
 *     pnpm --filter @eger/mobile test:unit
 *
 * `rootDir` is `'.'` (i.e. `apps/mobile/`) so the `<rootDir>` placeholders
 * below resolve to the correct paths when `jest --config` is invoked.
 */

module.exports = {
  rootDir: '.',
  testMatch: ['<rootDir>/lib/__smoke__/**/*.test.ts'],
  testTimeout: 30_000,
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
    ['jest-junit', { outputDirectory: '.artifacts/junit-unit', outputName: 'unit.xml' }],
  ],
};
