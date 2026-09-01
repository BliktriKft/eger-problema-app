/**
 * Re-export helper — no standalone code. The actual OpenAPI export is
 * handled inside `main.ts` (driven by the `EXPORT_OPENAPI` env var), so
 * the `docs:export:ci` flow is:
 *
 *   1. nest build          (compiles src/main.ts)
 *   2. EXPORT_OPENAPI=1    (boot + write openapi.json + exit)
 *   3. copy to packages/shared/openapi.json
 *
 * This file exists to keep `src/swagger.ts` discoverable in the source
 * tree and to document the export pattern.
 */
export const SWAGGER_HELPER_NOTE = 'main.ts handles EXPORT_OPENAPI=1';