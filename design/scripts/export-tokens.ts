// design/scripts/export-tokens.ts
// Converts design/tokens/*.json into three platform-specific artefacts:
//
//   1. apps/web/tailwind.config.ts        — theme.extend block, Tailwind utilities
//   2. apps/web/app/globals.css           — shadcn/ui-baseline HSL CSS variables
//   3. apps/mobile/src/theme/tokens.ts    — StyleSheet-compatible TS module
//
// Idempotent — re-running overwrites the generated sections while leaving the
// file header / hand-written wrappers in place. The script edits a fenced
// region inside each output, so any hand code outside the fences is preserved.
//
// Usage:
//   pnpm --filter @eger/design export:tokens
//   pnpm --filter @eger/design export:tokens -- --dry-run   (preview only)

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");
const TOKENS_DIR = join(REPO_ROOT, "design", "tokens");

const dryRun = process.argv.includes("--dry-run");

// ---------- token loader ----------

type Token = { value: unknown; type?: string; description?: string };
type Group = { [key: string]: Token | Group | unknown };

function isToken(v: unknown): v is Token {
  return !!v && typeof v === "object" && "value" in (v as object);
}

function* walk(group: Group, path: string[] = []): Generator<{ path: string[]; token: Token }> {
  for (const [k, v] of Object.entries(group)) {
    if (k.startsWith("$")) continue;
    if (isToken(v)) {
      yield { path: [...path, k], token: v };
    } else if (v && typeof v === "object") {
      yield* walk(v as Group, [...path, k]);
    }
  }
}

function loadTokens(file: string): Group {
  return JSON.parse(readFileSync(join(TOKENS_DIR, file), "utf8")) as Group;
}

// ---------- colour helpers ----------

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return null;
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslString(hsl: { h: number; s: number; l: number }): string {
  return `${hsl.h} ${hsl.s}% ${hsl.l}%`;
}

function isHex(v: unknown): v is string {
  return typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);
}

// ---------- generators ----------

function generateTailwindTheme(colors: Group): string {
  // colors.json structure: { color: { primary: { DEFAULT: { value }, fg: { value }, 50: { value } } } }
  // So the color tokens live at path length 3: ["color", "<group>", "<shade>"].
  // We emit: "<group>": { "<shade>": "<hex>", ... } per group.
  const grouped: Record<string, Record<string, string>> = {};
  for (const { path, token } of walk(colors)) {
    if (path.length !== 3) continue;
    if (!isHex(token.value)) continue;
    const [, group, shade] = path;
    grouped[group] = grouped[group] || {};
    grouped[group][shade] = token.value;
  }
  const lines: string[] = [];
  for (const group of Object.keys(grouped).sort()) {
    lines.push(`        "${group}": {`);
    for (const shade of Object.keys(grouped[group]).sort()) {
      lines.push(`          ${JSON.stringify(shade)}: ${JSON.stringify(grouped[group][shade])},`);
    }
    lines.push(`        },`);
  }
  return lines.join("\n");
}

function generateCssVariables(colors: Group): string {
  const lines: string[] = [];
  for (const { path, token } of walk(colors)) {
    if (path.length !== 3 || !isHex(token.value)) continue;
    const [, group, shade] = path;
    const hsl = hexToHsl(token.value);
    if (!hsl) continue;
    const cssName = shade === "DEFAULT" ? `--${group}` : `--${group}-${shade}`;
    lines.push(`    ${cssName}: ${hslString(hsl)};`);
  }
  return lines.join("\n");
}

function generateMobileTokens(colors: Group, typography: Group, spacing: Group, radius: Group, shadows: Group, motion: Group): string {
  // Flatten into a single TS module that React Native can import.
  const colorObj: Record<string, Record<string, string>> = {};
  for (const { path, token } of walk(colors)) {
    if (path.length !== 3 || !isHex(token.value)) continue;
    const [, group, shade] = path;
    colorObj[group] = colorObj[group] || {};
    colorObj[group][shade] = token.value;
  }

  const spacingObj: Record<string, string> = {};
  for (const { path, token } of walk(spacing)) {
    if (path.length === 2 && path[0] === "spacing") {
      spacingObj[path[1]] = String(token.value);
    }
  }

  const radiusObj: Record<string, string> = {};
  for (const { path, token } of walk(radius)) {
    if (path.length === 2 && path[0] === "radius") {
      radiusObj[path[1]] = String(token.value);
    }
  }

  const fontSizeObj: Record<string, string> = {};
  const fontWeightObj: Record<string, string> = {};
  const lineHeightObj: Record<string, string> = {};
  const fontFamilyObj: Record<string, string[]> = {};
  for (const { path, token } of walk(typography)) {
    if (path.length !== 2) continue;
    const [group, name] = path;
    if (group === "fontSize") fontSizeObj[name] = String(token.value);
    if (group === "fontWeight") fontWeightObj[name] = String(token.value);
    if (group === "lineHeight") lineHeightObj[name] = String(token.value);
    if (group === "fontFamily") fontFamilyObj[name] = Array.isArray(token.value) ? (token.value as string[]) : [String(token.value)];
  }

  const easeObj: Record<string, string> = {};
  const durationObj: Record<string, string> = {};
  for (const { path, token } of walk(motion)) {
    if (path.length !== 2) continue;
    const [group, name] = path;
    if (group === "ease") easeObj[name] = String(token.value);
    if (group === "duration") durationObj[name] = String(token.value);
  }

  // Hand-craft stable JSON for diffs.
  const serialize = (obj: Record<string, unknown>, indent = 0): string => {
    const pad = "  ".repeat(indent);
    const keys = Object.keys(obj).sort();
    const lines: string[] = [];
    for (const k of keys) {
      const v = obj[k];
      if (Array.isArray(v)) {
        lines.push(`${pad}${JSON.stringify(k)}: ${JSON.stringify(v)},`);
      } else if (v && typeof v === "object") {
        lines.push(`${pad}${JSON.stringify(k)}: {`);
        lines.push(serialize(v as Record<string, unknown>, indent + 1));
        lines.push(`${pad}},`);
      } else {
        lines.push(`${pad}${JSON.stringify(k)}: ${JSON.stringify(v)},`);
      }
    }
    return lines.join("\n");
  };

  return `// AUTO-GENERATED — do not edit by hand.
// Regenerate with: pnpm --filter @eger/design export:tokens
// Source: design/tokens/*.json (commit 0.1.0 of the Eger design system)

export const color = {
${serialize(colorObj, 1)}
} as const;

export const spacing = {
${serialize(spacingObj, 1)}
} as const;

export const radius = {
${serialize(radiusObj, 1)}
} as const;

export const fontSize = {
${serialize(fontSizeObj, 1)}
} as const;

export const fontWeight = {
${serialize(fontWeightObj, 1)}
} as const;

export const lineHeight = {
${serialize(lineHeightObj, 1)}
} as const;

export const fontFamily = {
${serialize(fontFamilyObj, 1)}
} as const;

export const ease = {
${serialize(easeObj, 1)}
} as const;

export const duration = {
${serialize(durationObj, 1)}
} as const;

export type Color = typeof color;
export type Spacing = typeof spacing;
export type Radius = typeof radius;
export type FontSize = typeof fontSize;
export type FontWeight = typeof fontWeight;
export type LineHeight = typeof lineHeight;
export type FontFamily = typeof fontFamily;
export type Ease = typeof ease;
export type Duration = typeof duration;
`;
}

// ---------- fenced in-place writers ----------

function ensureDir(p: string) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function writeFenced(file: string, fenceStart: string, fenceEnd: string, body: string, header: string) {
  let prev = "";
  if (existsSync(file)) prev = readFileSync(file, "utf8");
  const startIdx = prev.indexOf(fenceStart);
  const endIdx = prev.indexOf(fenceEnd);
  let next: string;
  if (startIdx >= 0 && endIdx > startIdx) {
    const before = prev.slice(0, startIdx);
    const after = prev.slice(endIdx + fenceEnd.length);
    next = `${before}${fenceStart}\n${body}\n${fenceEnd}${after}`;
  } else {
    next = `${header}${fenceStart}\n${body}\n${fenceEnd}\n`;
  }
  if (dryRun) {
    console.log(`  → would write ${file} (${body.length} chars)`);
  } else {
    ensureDir(dirname(file));
    writeFileSync(file, next);
    console.log(`  ✓ wrote ${file}`);
  }
}

function writeFencedWithTail(file: string, fenceStart: string, fenceEnd: string, body: string, header: string, tail: string) {
  let prev = "";
  if (existsSync(file)) prev = readFileSync(file, "utf8");
  const startIdx = prev.indexOf(fenceStart);
  const endIdx = prev.indexOf(fenceEnd);
  let next: string;
  if (startIdx >= 0 && endIdx > startIdx) {
    const before = prev.slice(0, startIdx);
    const after = prev.slice(endIdx + fenceEnd.length);
    next = `${before}${fenceStart}\n${body}\n${fenceEnd}${after}`;
  } else {
    next = `${header}${fenceStart}\n${body}\n${fenceEnd}${tail}\n`;
  }
  if (dryRun) {
    console.log(`  → would write ${file} (${body.length} chars)`);
  } else {
    ensureDir(dirname(file));
    writeFileSync(file, next);
    console.log(`  ✓ wrote ${file}`);
  }
}

// ---------- output: Tailwind config ----------

const TAILWIND_PATH = join(REPO_ROOT, "apps", "web", "tailwind.config.ts");
const TAILWIND_FENCE_START = "/* === AUTO-GEN:DESIGN_TOKENS — do not edit inside the fences === */";
const TAILWIND_FENCE_END = "/* === END AUTO-GEN:DESIGN_TOKENS === */";

const TAILWIND_HEADER = `// apps/web/tailwind.config.ts
// Hand-written wrappers (above the fences) and shadcn preset are kept by
// \`pnpm --filter @eger/design export:tokens\` which only rewrites
// the fenced AUTO-GEN block. Add new tokens to design/tokens/*.json and
// re-run the script.

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
`;
const TAILWIND_TAIL = `
    },
  },
  plugins: [],
};

export default config;
`;

function generateTailwindBody(themeBlock: string, spacingObj: Record<string, string>, radiusObj: Record<string, string>, shadowObj: Record<string, string>, typography: Group, motion: Group): string {
  const spacingLines = Object.keys(spacingObj).sort().map((k) => `        ${JSON.stringify(k)}: ${JSON.stringify(spacingObj[k])},`).join("\n");
  const radiusLines = Object.keys(radiusObj).sort().map((k) => `        ${JSON.stringify(k)}: ${JSON.stringify(radiusObj[k])},`).join("\n");
  const shadowLines = Object.keys(shadowObj).sort().map((k) => `        ${JSON.stringify(k)}: ${JSON.stringify(shadowObj[k])},`).join("\n");

  // Typography → fontSize, fontWeight, fontFamily, lineHeight
  const fontSize: Record<string, string> = {};
  const fontWeight: Record<string, string> = {};
  const fontFamily: Record<string, string[]> = {};
  const lineHeight: Record<string, string> = {};
  const letterSpacing: Record<string, string> = {};
  for (const { path, token } of walk(typography)) {
    if (path.length !== 2) continue;
    const [group, name] = path;
    if (group === "fontSize") fontSize[name] = String(token.value);
    if (group === "fontWeight") fontWeight[name] = String(token.value);
    if (group === "fontFamily") fontFamily[name] = Array.isArray(token.value) ? (token.value as string[]) : [String(token.value)];
    if (group === "lineHeight") lineHeight[name] = String(token.value);
    if (group === "letterSpacing") letterSpacing[name] = String(token.value);
  }

  const fontSizeLines = Object.keys(fontSize).sort().map((k) => {
    // Tailwind fontSize is a [size, { lineHeight }] tuple. We pair each size
    // with the closest lineHeight token by intent:
    //   xs/sm  → snug  (compact UI labels)
    //   base/lg → normal (body text)
    //   xl+    → tight  (headings)
    const lh = ["xs", "sm"].includes(k) ? "snug" : ["base", "lg"].includes(k) ? "normal" : "tight";
    return `        ${JSON.stringify(k)}: [${JSON.stringify(fontSize[k])}, { lineHeight: ${JSON.stringify(lineHeight[lh])} }],`;
  }).join("\n");
  const fontWeightLines = Object.keys(fontWeight).sort().map((k) => `        ${JSON.stringify(k)}: ${JSON.stringify(fontWeight[k])},`).join("\n");
  const fontFamilyLines = Object.keys(fontFamily).sort().map((k) => {
    const arr = fontFamily[k].map((v) => JSON.stringify(v)).join(", ");
    return `        ${JSON.stringify(k)}: [${arr}],`;
  }).join("\n");
  const lineHeightLines = Object.keys(lineHeight).sort().map((k) => `        ${JSON.stringify(k)}: ${JSON.stringify(lineHeight[k])},`).join("\n");
  const letterSpacingLines = Object.keys(letterSpacing).sort().map((k) => `        ${JSON.stringify(k)}: ${JSON.stringify(letterSpacing[k])},`).join("\n");

  // Motion
  const ease: Record<string, string> = {};
  const duration: Record<string, string> = {};
  for (const { path, token } of walk(motion)) {
    if (path.length !== 2) continue;
    const [group, name] = path;
    if (group === "ease") ease[name] = String(token.value);
    if (group === "duration") duration[name] = String(token.value);
  }
  const transitionTimingLines = Object.keys(ease).sort().map((k) => `        ${JSON.stringify(k)}: ${JSON.stringify(ease[k])},`).join("\n");
  const transitionDurationLines = Object.keys(duration).sort().map((k) => `        ${JSON.stringify(k)}: ${JSON.stringify(duration[k])},`).join("\n");

  return `      colors: {
${themeBlock}
      },
      borderRadius: {
${radiusLines}
      },
      boxShadow: {
${shadowLines}
      },
      spacing: {
${spacingLines}
      },
      fontSize: {
${fontSizeLines}
      },
      fontWeight: {
${fontWeightLines}
      },
      fontFamily: {
${fontFamilyLines}
      },
      lineHeight: {
${lineHeightLines}
      },
      letterSpacing: {
${letterSpacingLines}
      },
      transitionTimingFunction: {
${transitionTimingLines}
      },
      transitionDuration: {
${transitionDurationLines}
      },
      keyframes: {
        "vote-bump": {
          "0%, 100%": { transform: "scale(1)" },
          "50%":      { transform: "scale(1.18)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%":   { transform: "scale(1)",   opacity: "0.6" },
          "100%": { transform: "scale(1.4)", opacity: "0" },
        },
      },
      animation: {
        "vote-bump":  "vote-bump 250ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        shimmer:      "shimmer 1500ms ease-in-out infinite",
        "fade-in":    "fade-in 250ms cubic-bezier(0, 0, 0.2, 1)",
        "pulse-ring": "pulse-ring 1200ms cubic-bezier(0, 0, 0.2, 1) infinite",
      },
`;
}

// ---------- output: globals.css ----------

const GLOBALS_PATH = join(REPO_ROOT, "apps", "web", "app", "globals.css");
const GLOBALS_FENCE_START = "/* === AUTO-GEN:DESIGN_TOKENS — HSL CSS variables (shadcn/ui baseline) === */";
const GLOBALS_FENCE_END = "/* === END AUTO-GEN:DESIGN_TOKENS === */";

function generateGlobalsHeader(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* shadcn/ui baseline — keep these names; component recipes (Card, Dialog…)
       in apps/web/components/ui/*.tsx reference them via Tailwind's bg-background,
       text-foreground, border-border utilities. */
`;
}

function generateGlobalsBody(cssVars: string): string {
  // shadcn/ui convention: HSL channels only ("222 47% 11%"), wrapped in hsl(var(--x))
  // by Tailwind utilities. Background/foreground are derived from --background / --foreground.
  // The raw tokens (--primary, --secondary, --muted, --accent, --destructive,
  // --success, --warning, --background, --border, --input, --ring) are emitted by
  // generateCssVariables above. The shadcn alias block below exposes the names
  // that component recipes reference (--card, --popover, --primary-foreground, ...).
  return `    /* === LIGHT MODE — HSL channels, shadcn convention === */
${cssVars}

    /* shadcn/ui alias names — composed from the raw tokens above.
       Component recipes reference them via bg-background, text-foreground, etc. */
    --foreground:           var(--muted-900);
    --card:                 var(--background);
    --card-foreground:      var(--muted-900);
    --popover:              var(--background);
    --popover-foreground:   var(--muted-900);
    --primary-foreground:   var(--primary-fg);
    --secondary-foreground: var(--secondary-fg);
    --muted-foreground:     var(--muted-500);
    --accent-foreground:    var(--accent-fg);
    --destructive-foreground: var(--destructive-fg);
    --success-foreground:   var(--success-fg);
    --warning-foreground:   var(--warning-fg);
    --radius:               0.5rem;
  }

  .dark {
    /* shadcn/ui dark-mode override — only the alias names that components reference. */
    --foreground:           var(--muted-50);
    --card:                 var(--muted-800);
    --card-foreground:      var(--muted-50);
    --popover:              var(--muted-800);
    --popover-foreground:   var(--muted-50);
    --primary:              var(--primary-400);
    --primary-foreground:   var(--muted-900);
    --secondary:            var(--secondary-400);
    --secondary-foreground: var(--muted-50);
    --muted:                var(--muted-800);
    --muted-foreground:     var(--muted-300);
    --accent:               var(--accent-300);
    --accent-foreground:    var(--muted-900);
    --destructive:          var(--destructive-400);
    --destructive-foreground: var(--muted-50);
    --success:              var(--success-400);
    --success-foreground:   var(--muted-50);
    --warning:              var(--warning-300);
    --warning-foreground:   var(--muted-900);
    --border:               var(--muted-700);
    --input:                var(--muted-700);
    --ring:                 var(--secondary-400);
  }
`;
}

function generateGlobalsTail(): string {
  return `
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: theme('fontFamily.sans');
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}
`;
}

// ---------- output: mobile tokens ----------

const MOBILE_PATH = join(REPO_ROOT, "apps", "mobile", "src", "theme", "tokens.ts");

// ---------- main ----------

function main() {
  console.log(`Loading tokens from ${TOKENS_DIR}`);
  const colors = loadTokens("colors.json");
  const typography = loadTokens("typography.json");
  const spacing = loadTokens("spacing.json");
  const radius = loadTokens("radius.json");
  const shadows = loadTokens("shadows.json");
  const motion = loadTokens("motion.json");

  // Tailwind
  const themeBlock = generateTailwindTheme(colors);
  const spacingObj = collectFlat(spacing, "spacing");
  const radiusObj = collectFlat(radius, "radius");
  const shadowObj = collectFlat(shadows, "shadow");
  const twBody = generateTailwindBody(themeBlock, spacingObj, radiusObj, shadowObj, typography, motion);
  writeFencedWithTail(TAILWIND_PATH, TAILWIND_FENCE_START, TAILWIND_FENCE_END, twBody, TAILWIND_HEADER, TAILWIND_TAIL);

  // globals.css — write the full file if it doesn't exist, or rewrite just the fenced body if it does.
  const cssVars = generateCssVariables(colors);
  const globalsBody = generateGlobalsBody(cssVars);
  const globalsHeader = generateGlobalsHeader();
  const globalsTail = generateGlobalsTail();
  let prevCss = "";
  if (existsSync(GLOBALS_PATH)) prevCss = readFileSync(GLOBALS_PATH, "utf8");
  const startIdx = prevCss.indexOf(GLOBALS_FENCE_START);
  const endIdx = prevCss.indexOf(GLOBALS_FENCE_END);
  let nextCss: string;
  if (startIdx >= 0 && endIdx > startIdx) {
    const before = prevCss.slice(0, startIdx);
    const after = prevCss.slice(endIdx + GLOBALS_FENCE_END.length);
    nextCss = `${before}${GLOBALS_FENCE_START}\n${globalsBody}\n${GLOBALS_FENCE_END}${after}`;
  } else {
    nextCss = `${globalsHeader}${GLOBALS_FENCE_START}\n${globalsBody}\n${GLOBALS_FENCE_END}${globalsTail}\n`;
  }
  if (dryRun) {
    console.log(`  → would write ${GLOBALS_PATH}`);
  } else {
    ensureDir(dirname(GLOBALS_PATH));
    writeFileSync(GLOBALS_PATH, nextCss);
    console.log(`  ✓ wrote ${GLOBALS_PATH}`);
  }

  // Mobile tokens
  const mobileBody = generateMobileTokens(colors, typography, spacing, radius, shadows, motion);
  const MOBILE_FENCE_START = "// === AUTO-GEN:DESIGN_TOKENS — do not edit inside the fences ===";
  const MOBILE_FENCE_END = "// === END AUTO-GEN:DESIGN_TOKENS ===";
  const mobileHeader = `// apps/mobile/src/theme/tokens.ts
// Hand-written helpers (e.g. StyleSheet.create factories) above the fence are
// preserved by \`pnpm --filter @eger/design export:tokens\`. Add new tokens to
// design/tokens/*.json and re-run.

`;
  let prevMob = "";
  if (existsSync(MOBILE_PATH)) prevMob = readFileSync(MOBILE_PATH, "utf8");
  const mobStart = prevMob.indexOf(MOBILE_FENCE_START);
  const mobEnd = prevMob.indexOf(MOBILE_FENCE_END);
  let nextMob: string;
  if (mobStart >= 0 && mobEnd > mobStart) {
    const before = prevMob.slice(0, mobStart);
    const after = prevMob.slice(mobEnd + MOBILE_FENCE_END.length);
    nextMob = `${before}${MOBILE_FENCE_START}\n${mobileBody}\n${MOBILE_FENCE_END}${after}`;
  } else {
    nextMob = `${mobileHeader}${MOBILE_FENCE_START}\n${mobileBody}\n${MOBILE_FENCE_END}\n`;
  }
  if (dryRun) {
    console.log(`  → would write ${MOBILE_PATH}`);
  } else {
    ensureDir(dirname(MOBILE_PATH));
    writeFileSync(MOBILE_PATH, nextMob);
    console.log(`  ✓ wrote ${MOBILE_PATH}`);
  }

  console.log(dryRun ? "\n(dry-run — no files written)" : "\n✓ All outputs written.");
}

function collectFlat(group: Group, groupName: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { path, token } of walk(group)) {
    if (path.length === 2 && path[0] === groupName) {
      out[path[1]] = String(token.value);
    }
  }
  return out;
}

main();