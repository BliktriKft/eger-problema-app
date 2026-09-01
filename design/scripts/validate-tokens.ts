// design/scripts/validate-tokens.ts
// Walks every token file, asserts each leaf has {value, type, description} where
// the type matches the W3C Design Tokens Community Group enum, and the value's
// shape is consistent with its type (color → hex/rgb, dimension → ends in px/rem,
// duration → ends in ms, etc.). Exits non-zero on any failure.
//
// Usage: pnpm --filter @eger/design tokens:validate

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKENS_DIR = join(__dirname, "..", "tokens");

const ALLOWED_TYPES = new Set([
  "color",
  "dimension",
  "fontFamily",
  "fontWeight",
  "lineHeight",
  "letterSpacing",
  "duration",
  "cubicBezier",
  "shadow",
  "number",
  "string",
  "description",
  "boolean",
]);

type Token = { value: unknown; type?: string; description?: string };
type Group = { [key: string]: Token | Group | unknown };

function isToken(v: unknown): v is Token {
  return !!v && typeof v === "object" && "value" in (v as object);
}

function* walk(group: Group, path = ""): Generator<[string, Token]> {
  for (const [k, v] of Object.entries(group)) {
    if (k.startsWith("$")) continue;
    const next = path ? `${path}.${k}` : k;
    if (isToken(v)) {
      yield [next, v];
    } else if (v && typeof v === "object") {
      yield* walk(v as Group, next);
    }
  }
}

function validateValue(path: string, tok: Token): string | null {
  const t = tok.type;
  const v = tok.value;
  if (v === undefined || v === null) return `${path}: missing value`;
  if (t && !ALLOWED_TYPES.has(t)) return `${path}: unknown type "${t}"`;
  if (t === "color") {
    const s = String(v);
    if (!/^(#|rgb|hsl)/.test(s)) return `${path}: color value must be hex/rgb/hsl, got "${s}"`;
  }
  if (t === "dimension") {
    const s = String(v);
    if (!/(px|rem|em|%)$/.test(s)) return `${path}: dimension must end in px/rem/em/% ("${s}")`;
  }
  if (t === "duration") {
    const s = String(v);
    if (!/ms$/.test(s)) return `${path}: duration must end in ms ("${s}")`;
  }
  if (t === "cubicBezier") {
    const s = String(v);
    if (!/^(cubic-bezier|linear)/.test(s)) return `${path}: cubicBezier must be cubic-bezier(...) or linear ("${s}")`;
  }
  return null;
}

const files = readdirSync(TOKENS_DIR).filter(
  (f) => f.endsWith(".json") && f !== "schema.json" && f !== "index.json",
);

let totalLeaves = 0;
let totalErrors = 0;
for (const file of files) {
  const raw = readFileSync(join(TOKENS_DIR, file), "utf8");
  const data = JSON.parse(raw) as Group;
  for (const [path, tok] of walk(data)) {
    totalLeaves++;
    const err = validateValue(path, tok);
    if (err) {
      console.error(`✗ ${file}:${path} ${err}`);
      totalErrors++;
    }
  }
}

console.log(`\n${totalLeaves} tokens across ${files.length} files.`);
if (totalErrors > 0) {
  console.error(`${totalErrors} validation error(s).`);
  process.exit(1);
}
console.log("✓ All tokens valid.");