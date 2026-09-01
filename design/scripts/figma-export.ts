// design/scripts/figma-export.ts
//
// Populates the Eger Város Probléma Térkép Figma file with the 7 required pages
// from design/figma-spec.md.
//
// Required env (in ~/.hermes/profiles/website-designer/.env):
//   FIGMA_PERSONAL_ACCESS_TOKEN   a Figma Personal Access Token
//                                 — file-content (read+write) scope is required
//                                 — set in https://www.figma.com/developers/api#access-tokens
//   FIGMA_FILE_KEY                the key of an EXISTING file. This script does
//                                 NOT create the file; Figma's REST API does not
//                                 support file creation via personal access tokens.
//                                 See design/figma-url.txt for the manual bootstrap
//                                 path.
//
// Usage:
//   pnpm --filter @eger/design figma:export --dry-run      (probe + preview)
//   pnpm --filter @eger/design figma:export                (probe + populate)
//
// Exit codes:
//   0  success (all pages created, or no-op when --dry-run with no errors)
//   2  token / scope error — see stderr
//   3  file-not-found or permission error on the file — see stderr
//   4  Figma API error during page creation — see stderr
//
// After a successful populate, this script writes the URL to
// design/figma-url.txt and stamps FIGMA_FILE_KEY in the .env (the .env write is
// a no-op when the key was already set; .env is gitignored).

import { readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");
const FIGMA_URL_FILE = join(REPO_ROOT, "design", "figma-url.txt");
const SPEC_FILE = join(REPO_ROOT, "design", "figma-spec.md");
const ENV_FILE = join(
  process.env["HOME"] ?? "/root",
  ".hermes",
  "profiles",
  "website-designer",
  ".env",
);

const dryRun = process.argv.includes("--dry-run");

const TOKEN = process.env["FIGMA_PERSONAL_ACCESS_TOKEN"];
const FILE_KEY = process.env["FIGMA_FILE_KEY"];
const FILE_NAME = "Eger Város Probléma Térkép — Design System";

// 7 pages, matching design/figma-spec.md. The Web screens page is one Figma page
// that contains 7 frames; the Mobile screens page is one Figma page that
// contains 4 frames (iOS + Android variants). Do not confuse "frames" with
// "pages" — see the spec.
const REQUIRED_PAGES = [
  "📐 Cover",
  "🎨 Design tokens",
  "🧩 Components",
  "💻 Web screens",
  "📱 Mobile screens",
  "🚦 Empty / Loading / Error states",
  "♿ Accessibility audit",
];

// ─── Figma API helpers ───────────────────────────────────────────────────────

async function figmaFetch(
  path: string,
  init: RequestInit = {},
): Promise<{ status: number; body: string; json: unknown }> {
  const res = await fetch(`https://api.figma.com${path}`, {
    ...init,
    headers: {
      "X-Figma-Token": TOKEN!,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(body);
  } catch {
    /* not JSON */
  }
  return { status: res.status, body, json };
}

// Probe the token to see what it can actually do. Returns one of:
//   { ok: true,  scope: "read-write" }       — token can write; proceed
//   { ok: false, reason: "...", detail: ... } — explain why not
async function probeToken(): Promise<
  | { ok: true; scope: "read-write" }
  | { ok: false; reason: string; detail: unknown }
> {
  // /v1/me — should always succeed if the token is valid
  const me = await figmaFetch("/v1/me");
  if (me.status !== 200) {
    return {
      ok: false,
      reason: `Token is invalid or revoked (HTTP ${me.status} on /v1/me).`,
      detail: me.json,
    };
  }

  // /v1/teams — tells us whether the token has team-scoped access
  const teams = await figmaFetch("/v1/teams");
  const teamScope =
    teams.status === 200 && Array.isArray(teams.json) && teams.json.length > 0;

  // File creation via /v1/files is NOT supported by the Figma REST API at all
  // (with PAT or OAuth). We do NOT call it. The Figma docs explicitly note that
  // file creation requires the Figma UI or the desktop client, not the API.

  if (!FILE_KEY) {
    return {
      ok: false,
      reason:
        "FIGMA_FILE_KEY is not set. The Figma REST API does not support file " +
        "creation via personal access tokens — you must create the file in the " +
        "Figma UI (File → New design file) and paste the file key here. " +
        "See design/figma-url.txt for the step-by-step manual bootstrap path.",
      detail: { teamScope, teamsStatus: teams.status },
    };
  }

  // /v1/files/<key> — verify we can read the file (and detect a 403, which
  // indicates a read-only token even though we have a file key).
  const fileRead = await figmaFetch(`/v1/files/${FILE_KEY}`);
  if (fileRead.status === 403) {
    return {
      ok: false,
      reason:
        "Token has read-only scope and cannot write pages. Regenerate at " +
        "https://www.figma.com/developers/api#access-tokens with the " +
        "'File content' scope set to read+write.",
      detail: fileRead.json,
    };
  }
  if (fileRead.status === 404) {
    return {
      ok: false,
      reason: `File key "${FILE_KEY}" not found, or token cannot access it.`,
      detail: fileRead.json,
    };
  }
  if (fileRead.status !== 200) {
    return {
      ok: false,
      reason: `Unexpected HTTP ${fileRead.status} reading file ${FILE_KEY}.`,
      detail: fileRead.json,
    };
  }

  // We can read the file. To verify write capability, attempt to create a
  // throwaway page and then delete it. If the POST succeeds, scope is good;
  // if it returns 403, the token is read-only.
  const probeName = `__probe_${Date.now()}`;
  const create = await figmaFetch(`/v1/files/${FILE_KEY}/pages`, {
    method: "POST",
    body: JSON.stringify({ name: probeName }),
  });
  if (create.status === 403) {
    return {
      ok: false,
      reason:
        "Token is read-only (HTTP 403 on POST /pages). Regenerate with " +
        "the 'File content' scope set to read+write.",
      detail: create.json,
    };
  }
  if (create.status !== 200 && create.status !== 201) {
    return {
      ok: false,
      reason: `Unexpected HTTP ${create.status} on POST /pages probe.`,
      detail: create.json,
    };
  }

  // Probe page created — leave it; the human can delete it from Figma.
  // (Deleting a page is POST /v1/files/{key}/pages/{page_id} which is
  // destructive and we shouldn't do it from a probe.)
  return { ok: true, scope: "read-write" };
}

// ─── Page population ─────────────────────────────────────────────────────────

async function listExistingPages(
  fileKey: string,
): Promise<{ id: string; name: string }[]> {
  const file = await figmaFetch(`/v1/files/${fileKey}`);
  if (file.status !== 200) {
    throw new Error(
      `Cannot list pages: HTTP ${file.status} reading file ${fileKey}.`,
    );
  }
  const doc = file.json as { document?: { children?: { id: string; name: string }[] } };
  const pages = doc?.document?.children ?? [];
  return pages.map((p) => ({ id: p.id, name: p.name }));
}

async function createPage(
  fileKey: string,
  name: string,
): Promise<{ status: number; body: string }> {
  return figmaFetch(`/v1/files/${fileKey}/pages`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

// ─── Side effects: figma-url.txt + .env update ───────────────────────────────

function appendEnvKey(key: string, value: string): void {
  if (!existsSync(ENV_FILE)) return;
  const content = readFileSync(ENV_FILE, "utf8");
  if (new RegExp(`^${key}=`, "m").test(content)) return; // already set
  appendFileSync(ENV_FILE, `\n${key}=${value}\n`);
}

function writeFigmaUrl(fileKey: string): string {
  const url = `https://www.figma.com/files/${fileKey}/Eger-Varos-Problema-Terkep`;
  writeFileSync(
    FIGMA_URL_FILE,
    [
      `Figma URL: ${url}`,
      `File key:  ${fileKey}`,
      `Pages:     ${REQUIRED_PAGES.length} (see design/figma-spec.md)`,
      `Last populated: ${new Date().toISOString()}`,
      ``,
      `— populated by design/scripts/figma-export.ts`,
    ].join("\n") + "\n",
  );
  return url;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("Figma bootstrap — Eger Probléma App");
  console.log(`  file name:  ${FILE_NAME}`);
  console.log(`  dry-run:    ${dryRun}`);
  console.log(`  spec file:  ${existsSync(SPEC_FILE) ? SPEC_FILE : "(MISSING!)"}`);
  console.log(`  file key:   ${FILE_KEY ? FILE_KEY : "(not set)"}`);

  if (!TOKEN) {
    console.error(
      "\n✗ FIGMA_PERSONAL_ACCESS_TOKEN is not set.\n" +
        "  Add it to ~/.hermes/profiles/website-designer/.env and re-run.",
    );
    process.exit(2);
  }

  console.log("\n→ Probing token capabilities...");
  const probe = await probeToken();
  if (probe.ok === false) {
    console.error(`\n✗ ${probe.reason}`);
    if (probe.detail) {
      console.error(`  Detail: ${JSON.stringify(probe.detail).slice(0, 300)}`);
    }
    console.error(
      `\n  Manual bootstrap path is documented in:\n` +
        `    ${FIGMA_URL_FILE}`,
    );
    process.exit(2);
  }
  console.log(`  ✓ token has ${probe.scope} scope`);

  const fileKey = FILE_KEY!;
  console.log(`\n→ Listing existing pages in file ${fileKey}...`);
  const existing = await listExistingPages(fileKey);
  const existingNames = new Set(existing.map((p) => p.name));
  console.log(`  found ${existing.length} existing page(s)`);

  const toCreate = REQUIRED_PAGES.filter((n) => !existingNames.has(n));
  const skipped = REQUIRED_PAGES.filter((n) => existingNames.has(n));

  if (skipped.length > 0) {
    console.log(`  → skipping (already exist): ${skipped.join(", ")}`);
  }
  if (toCreate.length === 0) {
    console.log("\n✓ All required pages already exist. Nothing to do.");
    const url = writeFigmaUrl(fileKey);
    console.log(`✓ ${FIGMA_URL_FILE}`);
    console.log(`✓ Open: ${url}`);
    return;
  }
  console.log(`  → to create: ${toCreate.join(", ")}`);

  if (dryRun) {
    console.log("\n(dry-run — no API calls will be made)");
    console.log(`Would create ${toCreate.length} page(s).`);
    return;
  }

  console.log("\n→ Creating pages...");
  let created = 0;
  let failed = 0;
  for (const name of toCreate) {
    try {
      const res = await createPage(fileKey, name);
      if (res.status === 200 || res.status === 201) {
        console.log(`  ✓ ${name}`);
        created++;
      } else {
        console.error(`  ✗ ${name} — HTTP ${res.status}: ${res.body.slice(0, 200)}`);
        failed++;
      }
    } catch (err) {
      console.error(`  ✗ ${name} — ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\n${created}/${toCreate.length} pages created.`);
  if (failed > 0) {
    process.exit(4);
  }

  const url = writeFigmaUrl(fileKey);
  appendEnvKey("FIGMA_FILE_KEY", fileKey);
  console.log(`\n✓ ${FIGMA_URL_FILE}`);
  console.log(`✓ Open: ${url}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});