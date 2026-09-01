// design/scripts/contrast-audit.ts
// Computes WCAG 2.1 contrast ratios for every meaningful FG/BG pair derived
// from the design tokens, then prints a verdict against AA (4.5:1 normal text,
// 3:1 large text) thresholds. Used by `pnpm --filter @eger/design
// contrast:audit`.
//
// Keep this in sync with design/accessibility-audit.md. If you add a new
// pair here, also document it there.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKENS_DIR = join(__dirname, "..", "tokens");

// ---------- WCAG luminance ----------

function srgbToLinear(c: number): number {
  const n = c / 255;
  return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrast(c1: string, c2: string): number {
  const L1 = luminance(c1);
  const L2 = luminance(c2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

function verdict(r: number): string {
  if (r >= 7) return "AAA";
  if (r >= 4.5) return "AA";
  if (r >= 3) return "AA-large-only";
  return "FAIL";
}

// ---------- token loader ----------

type Token = { value: unknown; type?: string };
type Group = { [key: string]: Token | Group | unknown };

function isToken(v: unknown): v is Token {
  return !!v && typeof v === "object" && "value" in (v as object);
}

function* walk(g: Group, path: string[] = []): Generator<{ path: string[]; token: Token }> {
  for (const [k, v] of Object.entries(g)) {
    if (k.startsWith("$")) continue;
    if (isToken(v)) yield { path: [...path, k], token: v };
    else if (v && typeof v === "object") yield* walk(v as Group, [...path, k]);
  }
}

function getHex(group: Group, ...segments: string[]): string {
  for (const { path, token } of walk(group)) {
    if (segments.every((s, i) => path[i] === s) && path.length === segments.length) {
      return String(token.value);
    }
  }
  throw new Error(`Token not found: ${segments.join(".")}`);
}

const colors = JSON.parse(readFileSync(join(TOKENS_DIR, "colors.json"), "utf8")) as Group;

const hex = (g: string, shade: string = "DEFAULT"): string => getHex(colors, "color", g, shade);

// ---------- pair matrix ----------

interface Pair {
  label: string;
  fg: string;
  bg: string;
  expected: "AAA" | "AA" | "AA-large-only" | "FAIL-decorative";
}

const pairs: Pair[] = [
  // Body text on page
  { label: "muted-900 on background",  fg: hex("muted", "900"), bg: hex("background"), expected: "AAA" },
  { label: "muted-900 on muted-50",    fg: hex("muted", "900"), bg: hex("muted", "50"),  expected: "AAA" },
  { label: "muted-900 on muted-100",   fg: hex("muted", "900"), bg: hex("muted", "100"), expected: "AAA" },
  { label: "muted-700 on muted-100",   fg: hex("muted", "700"), bg: hex("muted", "100"), expected: "AAA" },
  { label: "muted-600 on muted-100",   fg: hex("muted", "600"), bg: hex("muted", "100"), expected: "AA" },
  { label: "muted-500 on muted-100",   fg: hex("muted", "500"), bg: hex("muted", "100"), expected: "AA-large-only" },
  // Dark mode
  { label: "muted-50 on muted-900",    fg: hex("muted", "50"),  bg: hex("muted", "900"), expected: "AAA" },
  { label: "muted-300 on muted-900",   fg: hex("muted", "300"), bg: hex("muted", "900"), expected: "AAA" },
  // Primary
  { label: "primary on background",    fg: hex("primary"),      bg: hex("background"), expected: "AA" },
  { label: "primary on primary-50",    fg: hex("primary"),      bg: hex("primary", "50"), expected: "AA" },
  { label: "primary-fg on primary",    fg: hex("primary", "fg"), bg: hex("primary"), expected: "AA" },
  { label: "primary-400 on muted-900", fg: hex("primary", "400"), bg: hex("muted", "900"), expected: "AA-large-only" },
  // Secondary
  { label: "secondary on background",  fg: hex("secondary"),    bg: hex("background"), expected: "AAA" },
  { label: "secondary-fg on secondary", fg: hex("secondary", "fg"), bg: hex("secondary"), expected: "AAA" },
  // Accent
  { label: "accent on muted-900",      fg: hex("accent"),       bg: hex("muted", "900"), expected: "AAA" },
  { label: "accent-fg on accent",      fg: hex("accent", "fg"), bg: hex("accent"),      expected: "AA" },
  // Destructive
  { label: "destructive on background", fg: hex("destructive"), bg: hex("background"), expected: "AA" },
  { label: "destructive-fg on destructive", fg: hex("destructive", "fg"), bg: hex("destructive"), expected: "AA" },
  // Success (note: success on white FAILS)
  { label: "success on background",    fg: hex("success"),      bg: hex("background"), expected: "AA-large-only" },
  { label: "success-fg on success",    fg: hex("success", "fg"), bg: hex("success"),   expected: "AA-large-only" },
  { label: "success-700 on background", fg: hex("success", "700"), bg: hex("background"), expected: "AA" },
  { label: "success-700 on success-50", fg: hex("success", "700"), bg: hex("success", "50"), expected: "AA" },
  // Warning (note: warning on white FAILS)
  { label: "warning on background",    fg: hex("warning"),      bg: hex("background"), expected: "AA-large-only" },
  { label: "warning-fg on warning",    fg: hex("warning", "fg"), bg: hex("warning"),   expected: "AA-large-only" },
  { label: "warning-700 on warning-50", fg: hex("warning", "700"), bg: hex("warning", "50"), expected: "AA" },
  // Focus ring
  { label: "ring on background",       fg: hex("ring"),         bg: hex("background"), expected: "AAA" },
  { label: "ring on muted-100",        fg: hex("ring"),         bg: hex("muted", "100"), expected: "AAA" },
  { label: "ring on accent-50",        fg: hex("ring"),         bg: hex("accent", "50"), expected: "AAA" },
  // Borders (non-text contrast, 3:1 threshold)
  { label: "border on background",     fg: hex("border"),       bg: hex("background"), expected: "FAIL-decorative" },
  { label: "border on muted-100",      fg: hex("border"),       bg: hex("muted", "100"), expected: "FAIL-decorative" },
  { label: "muted-300 on background",  fg: hex("muted", "300"), bg: hex("background"), expected: "FAIL-decorative" },
  { label: "primary border on background", fg: hex("primary"), bg: hex("background"), expected: "AA" },
  { label: "destructive border on background", fg: hex("destructive"), bg: hex("background"), expected: "AA" },
];

// ---------- run ----------

const MIN: Record<string, number> = {
  "AAA": 7,
  "AA": 4.5,
  "AA-large-only": 3,
  "FAIL-decorative": 0,
};

const header = `${"label".padEnd(42)} ${"ratio".padStart(7)}  ${"verdict".padEnd(14)}  ${"expected".padEnd(18)}  status`;
console.log("\n" + header);
console.log("-".repeat(95));

let fails = 0;
for (const pair of pairs) {
  const r = contrast(pair.fg, pair.bg);
  const actual = verdict(r);
  const expectedMin = MIN[pair.expected];
  const pass = actual === "FAIL" ? pair.expected === "FAIL-decorative" : r >= expectedMin;
  if (!pass) fails++;
  const status = pass ? "OK" : "REGRESSION";
  const ratioStr = `${r.toFixed(2)}:1`;
  console.log(`${pair.label.padEnd(42)} ${ratioStr.padStart(7)}  ${actual.padEnd(14)}  ${pair.expected.padEnd(18)}  ${status}`);
}

console.log("-".repeat(95));
if (fails > 0) {
  console.error(`\n✗ ${fails} contrast regressions.`);
  process.exit(1);
}
console.log(`\n✓ All ${pairs.length} pairs meet their expected threshold.`);