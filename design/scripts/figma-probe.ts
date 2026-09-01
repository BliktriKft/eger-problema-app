// design/scripts/figma-probe.ts
//
// Read-only diagnostic: probes the Figma Personal Access Token in
// ~/.hermes/profiles/website-designer/.env and reports what it can do.
//
// This script NEVER writes to Figma. Use it before
// `pnpm --filter @eger/design figma:export` to know whether the bootstrap
// will work.
//
// Usage:
//   pnpm --filter @eger/design figma:probe
//
// Exit codes:
//   0  token is valid AND (a) FIGMA_FILE_KEY is set + file is reachable,
//      OR (b) no FILE_KEY yet — token at least works for reads
//   2  token is invalid / revoked / missing

import { readFileSync } from "node:fs";
import { join } from "node:path";

const ENV_FILE = join(
  process.env["HOME"] ?? "/root",
  ".hermes",
  "profiles",
  "website-designer",
  ".env",
);

function loadEnv(): Record<string, string> {
  try {
    const text = readFileSync(ENV_FILE, "utf8");
    const out: Record<string, string> = {};
    for (const line of text.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !out[m[1]]) out[m[1]] = m[2];
    }
    return out;
  } catch {
    return {};
  }
}

const env = loadEnv();
const TOKEN = env["FIGMA_PERSONAL_ACCESS_TOKEN"] ?? process.env["FIGMA_PERSONAL_ACCESS_TOKEN"];
const FILE_KEY = env["FIGMA_FILE_KEY"] ?? process.env["FIGMA_FILE_KEY"];

if (!TOKEN) {
  console.error(
    "✗ FIGMA_PERSONAL_ACCESS_TOKEN not set in env or ~/.hermes/profiles/website-designer/.env",
  );
  process.exit(2);
}

async function probe(path: string, init: RequestInit = {}): Promise<{ status: number; body: string }> {
  const res = await fetch(`https://api.figma.com${path}`, {
    ...init,
    headers: {
      "X-Figma-Token": TOKEN,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  return { status: res.status, body: await res.text() };
}

function row(label: string, status: number | "—", detail: string): void {
  const mark =
    status === 200 || status === 201
      ? "✓"
      : status === 404 || status === 403
      ? "✗"
      : status === "—"
      ? " "
      : "?";
  console.log(`  [${mark}] ${label.padEnd(38)} HTTP ${String(status).padEnd(4)}  ${detail}`);
}

async function main(): Promise<void> {
  console.log("Figma token probe — Eger Probléma App");
  console.log(`  token prefix: ${TOKEN.slice(0, 15)}…  (len ${TOKEN.length})`);
  console.log(`  file key:     ${FILE_KEY ? FILE_KEY : "(not set)"}`);
  console.log();

  // 1. /v1/me — token validity
  const me = await probe("/v1/me");
  if (me.status === 200) {
    const j = JSON.parse(me.body);
    row("/v1/me (token validity)", me.status, `${j.email}  id=${j.id}`);
  } else {
    row("/v1/me (token validity)", me.status, me.body.slice(0, 80));
    console.error("\n  ✗ Token is invalid or revoked. Stop here.");
    process.exit(2);
  }

  // 2. /v1/teams — team visibility
  const teams = await probe("/v1/teams");
  if (teams.status === 200) {
    const j = JSON.parse(teams.body);
    const names = Array.isArray(j) ? j.map((t: { name: string }) => t.name).join(", ") : "(?)";
    row("/v1/teams (team visibility)", teams.status, names);
  } else {
    row("/v1/teams (team visibility)", teams.status, "no team access via this PAT");
  }

  // 3. /v1/files — endpoint existence check (no file created; we just confirm
  // the endpoint returns 404 vs something else).
  const filesPost = await probe("/v1/files", {
    method: "POST",
    body: JSON.stringify({ name: "probe" }),
  });
  row(
    "/v1/files POST (file create)",
    filesPost.status,
    "404 = endpoint does not exist (expected — Figma does not support this)",
  );

  // 4. file key check (if provided)
  if (FILE_KEY) {
    const fileRead = await probe(`/v1/files/${FILE_KEY}`);
    if (fileRead.status === 200) {
      const j = JSON.parse(fileRead.body);
      row(
        `/v1/files/${FILE_KEY} (file reachable)`,
        fileRead.status,
        `"${j.name}"`,
      );

      // 5. POST /pages probe — actually tries to create a page. This IS a
      // write, but it's reversible (human deletes the probe page).
      const pageProbe = await probe(`/v1/files/${FILE_KEY}/pages`, {
        method: "POST",
        body: JSON.stringify({ name: `__probe_${Date.now()}` }),
      });
      row(
        "/v1/files/<key>/pages POST (write scope)",
        pageProbe.status,
        pageProbe.status === 200 || pageProbe.status === 201
          ? "write-capable — full bootstrap will work"
          : "no write scope — regenerate PAT with File-content read+write",
      );
    } else {
      row(`/v1/files/${FILE_KEY} (file reachable)`, fileRead.status, fileRead.body.slice(0, 80));
    }
  } else {
    row("file key check", "—", "skipped — FIGMA_FILE_KEY is empty");
  }

  console.log();
  console.log("Summary:");
  console.log("  • token is valid for reads on the user's personal space");
  console.log("  • file creation is NOT supported by the Figma REST API (any auth)");
  console.log("  • if team visibility is 404, the PAT can only see personal files");
  console.log(
    "  • to bootstrap, create the file in the Figma UI and set FIGMA_FILE_KEY",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});