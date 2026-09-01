// apps/mobile/src/theme/tokens.ts
// Hand-written helpers (e.g. StyleSheet.create factories) above the fence are
// preserved by `pnpm --filter @eger/design export:tokens`. Add new tokens to
// design/tokens/*.json and re-run.

// === AUTO-GEN:DESIGN_TOKENS — do not edit inside the fences ===
// AUTO-GENERATED — do not edit by hand.
// Regenerate with: pnpm --filter @eger/design export:tokens
// Source: design/tokens/*.json (commit 0.1.0 of the Eger design system)

export const color = {
  "accent": {
    "100": "#FDE68A",
    "200": "#FCD34D",
    "300": "#FBBF24",
    "400": "#F59E0B",
    "50": "#FEF3C7",
    "500": "#D97706",
    "600": "#B45309",
    "700": "#92400E",
    "800": "#78350F",
    "900": "#451A03",
    "DEFAULT": "#F59E0B",
    "fg": "#1F2937",
  },
  "background": {
    "DEFAULT": "#FFFFFF",
    "fg": "#111827",
  },
  "border": {
    "DEFAULT": "#E5E7EB",
    "fg": "#111827",
  },
  "destructive": {
    "100": "#FECACA",
    "200": "#FCA5A5",
    "300": "#F87171",
    "400": "#EF4444",
    "50": "#FEE2E2",
    "500": "#DC2626",
    "600": "#B91C1C",
    "700": "#991B1B",
    "800": "#7F1D1D",
    "900": "#450A0A",
    "DEFAULT": "#DC2626",
    "fg": "#FFFFFF",
  },
  "input": {
    "DEFAULT": "#E5E7EB",
    "fg": "#111827",
  },
  "muted": {
    "100": "#F3F4F6",
    "200": "#E5E7EB",
    "300": "#D1D5DB",
    "400": "#9CA3AF",
    "50": "#F9FAFB",
    "500": "#6B7280",
    "600": "#4B5563",
    "700": "#374151",
    "800": "#1F2937",
    "900": "#111827",
    "DEFAULT": "#F3F4F6",
    "fg": "#111827",
  },
  "primary": {
    "100": "#FCC4CD",
    "200": "#F98EA0",
    "300": "#F35873",
    "400": "#EC2247",
    "50": "#FEE7EB",
    "500": "#C8102E",
    "600": "#A60D26",
    "700": "#84091E",
    "800": "#630616",
    "900": "#41030E",
    "DEFAULT": "#C8102E",
    "fg": "#FFFFFF",
  },
  "ring": {
    "DEFAULT": "#1E3A8A",
    "fg": "#FFFFFF",
  },
  "secondary": {
    "100": "#D4DCF4",
    "200": "#A9B9E9",
    "300": "#7E96DE",
    "400": "#5373D3",
    "50": "#EEF1FB",
    "500": "#1E3A8A",
    "600": "#172E6E",
    "700": "#112352",
    "800": "#0B1737",
    "900": "#060C1B",
    "DEFAULT": "#1E3A8A",
    "fg": "#FFFFFF",
  },
  "success": {
    "100": "#A7F3D0",
    "200": "#6EE7B7",
    "300": "#34D399",
    "400": "#10B981",
    "50": "#D1FAE5",
    "500": "#059669",
    "600": "#047857",
    "700": "#065F46",
    "800": "#064E3B",
    "900": "#022C22",
    "DEFAULT": "#059669",
    "fg": "#FFFFFF",
  },
  "warning": {
    "100": "#FDE68A",
    "200": "#FCD34D",
    "300": "#FBBF24",
    "400": "#F59E0B",
    "50": "#FEF3C7",
    "500": "#D97706",
    "600": "#B45309",
    "700": "#92400E",
    "800": "#78350F",
    "900": "#451A03",
    "DEFAULT": "#D97706",
    "fg": "#FFFFFF",
  },
} as const;

export const spacing = {
  "0": "0px",
  "1": "4px",
  "12": "48px",
  "16": "64px",
  "2": "8px",
  "24": "96px",
  "3": "12px",
  "32": "128px",
  "4": "16px",
  "48": "192px",
  "6": "24px",
  "64": "256px",
  "8": "32px",
} as const;

export const radius = {
  "full": "9999px",
  "lg": "12px",
  "md": "8px",
  "none": "0px",
  "sm": "4px",
  "xl": "16px",
} as const;

export const fontSize = {
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
  "5xl": "3rem",
  "6xl": "3.75rem",
  "base": "1rem",
  "lg": "1.125rem",
  "sm": "0.875rem",
  "xl": "1.25rem",
  "xs": "0.75rem",
} as const;

export const fontWeight = {
  "bold": "700",
  "medium": "500",
  "regular": "400",
  "semibold": "600",
} as const;

export const lineHeight = {
  "loose": "1.75",
  "normal": "1.5",
  "relaxed": "1.625",
  "snug": "1.375",
  "tight": "1.25",
} as const;

export const fontFamily = {
  "mono": ["\"JetBrains Mono\"","Menlo","Monaco","Consolas","Liberation Mono","monospace"],
  "sans": ["Inter","Inter Variable","system-ui","-apple-system","Segoe UI","Roboto","Helvetica Neue","Arial","sans-serif"],
  "serif": ["\"Source Serif 4\"","\"Source Serif Pro\"","Georgia","Cambria","Times New Roman","serif"],
} as const;

export const ease = {
  "in": "cubic-bezier(0.4, 0, 1, 1)",
  "inOut": "cubic-bezier(0.4, 0, 0.2, 1)",
  "linear": "linear",
  "out": "cubic-bezier(0, 0, 0.2, 1)",
  "outBack": "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

export const duration = {
  "fast": "150ms",
  "instant": "0ms",
  "normal": "250ms",
  "slow": "400ms",
  "slower": "600ms",
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

// === END AUTO-GEN:DESIGN_TOKENS ===
