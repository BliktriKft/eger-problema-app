// @eger/shared — single entry point for cross-app types, schemas, constants.
// Downstream apps can either deep-import (`@eger/shared/types/problem`) or
// use this barrel. Keep it minimal; the dist structure is per-subdir.

export * from './constants/index.js';
export * from './types/index.js';
export * from './schemas/index.js';