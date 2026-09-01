// Learn more https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// 1. Let Metro look for modules in the monorepo root (pnpm workspaces).
//    This is what lets `apps/mobile` import `@eger/shared` from `packages/shared`.
//    Without this, Metro only watches `apps/mobile/node_modules`.
config.watchFolders = [monorepoRoot];

// 2. Force Metro's resolver to walk up to the monorepo root when resolving
//    bare-specifiers.  We restrict the scope to project files so we don't
//    accidentally pull in duplicated copies of React from a sibling app.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. pnpm symlinks bare packages directly under `node_modules/.pnpm/<name>@...`
//    but the workspace package itself is symlinked into `packages/shared`.
//    We enable `unstable_enableSymlinks` + `unstable_enablePackageExports` so
//    Metro honours the `exports` field in `packages/shared/package.json`.
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// 4. Disable the duplicate React check — in a monorepo with multiple React
//    copies, Expo's dedup heuristic can be too aggressive.  We trust pnpm.
config.resolver.disableHierarchicalLookup = false;

// 5. Tell Metro that any source file inside `packages/*` that is *consumed* by
//    this app counts as part of the project (so HMR + watches work).
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
};

// 6. Stable IDs across machines — affects only cache keys, not behaviour.
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    // Inline requires speed up cold start on large apps.
    inlineRequires: true,
  },
});

module.exports = config;
