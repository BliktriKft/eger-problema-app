// design/scripts/figma-export.ts
// Creates the Eger Probléma App Figma file in the BliktriKft workspace and
// populates the 13 required pages with the page-level structure documented in
// design/figma-spec.md. Requires FIGMA_PERSONAL_ACCESS_TOKEN and FIGMA_TEAM_ID
// (the BliktriKft team's id; get it from https://api.figma.com/v1/teams) in
// ~/.hermes/profiles/website-designer/.env.
//
// Usage:
//   pnpm --filter @eger/design figma:export --dry-run    (preview only)
//   pnpm --filter @eger/design figma:export              (actually create)
//
// After successful bootstrap the file URL is written to design/figma-url.txt
// and FIGMA_FILE_KEY is appended to the .env (it is *not* committed — .gitignore).

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");
const FIGMA_URL_FILE = join(REPO_ROOT, "design", "figma-url.txt");
const ENV_FILE = join(process.env["HOME"] ?? "/root", ".hermes", "profiles", "website-designer", ".env");
const SPEC_FILE = join(REPO_ROOT, "design", "figma-spec.md");

const dryRun = process.argv.includes("--dry-run");

const TOKEN = process.env["FIGMA_PERSONAL_ACCESS_TOKEN"];
const TEAM_ID = process.env["FIGMA_TEAM_ID"] ?? "BliktriKft"; // team name is also accepted
const FILE_NAME = "Eger Város Probléma Térkép — Design System";

if (!TOKEN) {
  console.error("✗ FIGMA_PERSONAL_ACCESS_TOKEN not set in env.");
  console.error("  Add it to ~/.hermes/profiles/website-designer/.env and re-run.");
  console.error("  Required scopes: file-content (read + write).");
  process.exit(1);
}

const REQUIRED_PAGES = [
  "📐 Cover",
  "🎨 Design tokens",
  "🧩 Components",
  "💻 Web screens",
  "📱 Mobile screens",
  "🚦 Empty / Loading / Error states",
  "♿ Accessibility audit",
];

async function figmaFetch(path: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(`https://api.figma.com${path}`, {
    ...init,
    headers: {
      "X-Figma-Token": TOKEN!,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Figma ${res.status} ${res.statusText} on ${path}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

async function createFile(): Promise<{ key: string; url: string }> {
  // Figma REST API does not expose a "create file" endpoint for personal tokens.
  // The team endpoint requires OAuth. Until either is available, the user must
  // create the file by hand in Figma (File → New) and paste the key here.
  // This script will then populate the page structure.
  throw new Error(
    "Figma REST API does not support programmatic file creation with personal access tokens.\n" +
      "Please create the file manually:\n" +
      "  1. Open https://www.figma.com/files/team/BliktriKft\n" +
      "  2. Click 'New design file' → name it '" + FILE_NAME + "'\n" +
      "  3. Copy the file key from the URL (between /file/ and the file name).\n" +
      "  4. Set FIGMA_FILE_KEY=<the-key> in your .env.\n" +
      "  5. Re-run this script — it will populate the pages.",
  );
}

async function populatePages(fileKey: string): Promise<number> {
  let count = 0;
  for (const name of REQUIRED_PAGES) {
    if (dryRun) {
      console.log(`  → would create page: ${name}`);
    } else {
      try {
        await figmaFetch(`/v1/files/${fileKey}/pages`, {
          method: "POST",
          body: JSON.stringify({ name }),
        });
        count++;
      } catch (err) {
        console.error(`  ✗ failed to create "${name}": ${(err as Error).message}`);
      }
    }
  }
  return count;
}

async function main() {
  console.log("Figma bootstrap — Eger Probléma App");
  console.log(`  team: ${TEAM_ID}`);
  console.log(`  dry-run: ${dryRun}`);
  console.log(`  spec:   ${existsSync(SPEC_FILE) ? SPEC_FILE : "(missing!)"}`);

  const existingKey = process.env["FIGMA_FILE_KEY"];
  let fileKey = existingKey;

  if (!fileKey) {
    console.log("\n→ No FIGMA_FILE_KEY set; attempting to create file...");
    try {
      const { key, url } = await createFile();
      fileKey = key;
      console.log(`  ✓ file created: ${url}`);
    } catch (err) {
      console.error(`  ✗ ${(err as Error).message}\n`);
      console.log("Falling back to manual mode — see design/figma-url.txt for instructions.");
      process.exit(2);
    }
  } else {
    console.log(`\n→ Using existing file key: ${fileKey}`);
  }

  console.log("\n→ Populating pages...");
  const created = await populatePages(fileKey!);
  console.log(`  ${dryRun ? "would create" : "created"} ${created}/${REQUIRED_PAGES.length} pages`);

  if (!dryRun && fileKey) {
    const url = `https://www.figma.com/files/${fileKey}/Eger-Varos-Problema-Terkep`;
    writeFileSync(
      FIGMA_URL_FILE,
      `Figma URL: ${url}\nFile key: ${fileKey}\nLast bootstrapped: ${new Date().toISOString()}\n`,
    );
    console.log(`\n✓ Saved ${FIGMA_URL_FILE}`);
    console.log(`✓ Open: ${url}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});