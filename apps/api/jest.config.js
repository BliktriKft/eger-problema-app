/**
 * Jest config for the API package.
 *
 * Uses ts-jest with the project tsconfig so we don't need a parallel
 * Babel pipeline. The `isolatedModules` flag lets ts-jest transpile
 * each file independently (faster startup, no full type-check).
 *
 * The `testRegex` restricts Jest to `*.spec.ts` files so production
 * code under `src/**` is never collected.
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  roots: ["<rootDir>/src"],
  testRegex: "\\.spec\\.ts$",
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.json",
        isolatedModules: true,
        diagnostics: false,
      },
    ],
  },
  moduleFileExtensions: ["ts", "js", "json"],
  moduleNameMapper: {
    "^@eger/shared$": "<rootDir>/../../packages/shared/src",
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
