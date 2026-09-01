// design/map/pins.tsx
// React component wrappers for the SVG pin icons in design/map/*.svg.
// Used by apps/web/components/map/MapMarker.tsx (Leaflet L.divIcon) and
// apps/mobile/components/map/MapPin.tsx (react-native-maps custom Marker).
// Color/fill is passed as a prop so the same component can render any of the
// 6 base types in any state (default, voted, own, moderated, etc.).
//
// NOTE: this file is the source of truth for pin geometry. The .svg files in
// design/map/ are the exports for use in Figma / docs / Storybook.

import type { CSSProperties } from "react";

export type PinType =
  | "default"
  | "school"
  | "hospital"
  | "pool"
  | "library"
  | "government"
  | "other";

export interface PinProps {
  type?: PinType;
  /** Width in CSS pixels. Default 32. Height auto-derives (40 default). */
  size?: number;
  /** Optional override fill (defaults per type). */
  fill?: string;
  /** Optional override stroke (defaults per type). */
  stroke?: string;
  /** Inner icon color. */
  iconColor?: string;
  /** Additional className for the wrapper SVG. */
  className?: string;
  /** Accessibility label. Required. */
  "aria-label": string;
  /** Apply a 3px ring around the pin (voted/own/moderated/selected states). */
  ringColor?: string;
  /** Decorative only — set true if the pin is decorative and label is elsewhere. */
  decorative?: boolean;
  style?: CSSProperties;
}

const TYPE_DEFAULTS: Record<PinType, { fill: string; stroke: string; icon: string }> = {
  default:    { fill: "#374151", stroke: "#111827", icon: "#F3F4F6" },
  school:     { fill: "#F59E0B", stroke: "#92400E", icon: "#451A03" },
  hospital:   { fill: "#DC2626", stroke: "#7F1D1D", icon: "#FFFFFF" },
  pool:       { fill: "#5373D3", stroke: "#112352", icon: "#FFFFFF" },
  library:    { fill: "#92400E", stroke: "#451A03", icon: "#FEF3C7" },
  government: { fill: "#1E3A8A", stroke: "#060C1B", icon: "#FFFFFF" },
  other:      { fill: "#6B7280", stroke: "#1F2937", icon: "#F3F4F6" },
};

export function Pin({
  type = "default",
  size = 32,
  fill,
  stroke,
  iconColor,
  ringColor,
  className,
  style,
  decorative,
  "aria-label": ariaLabel,
}: PinProps) {
  const palette = TYPE_DEFAULTS[type];
  const f = fill ?? palette.fill;
  const s = stroke ?? palette.stroke;
  const ic = iconColor ?? palette.icon;
  const h = (size / 32) * 40; // preserve 32:40 aspect ratio

  const a11y = decorative
    ? { "aria-hidden": true as const, focusable: false }
    : { role: "img" as const, "aria-label": ariaLabel };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={h}
      viewBox="0 0 32 40"
      fill="none"
      className={className}
      style={style}
      {...a11y}
    >
      {ringColor && (
        <path
          d="M16 0.5 C8 0.5 1.5 7 1.5 16 C1.5 25 16 25 16 25 C16 25 30.5 25 30.5 16 C30.5 7 24 0.5 16 0.5 Z"
          fill="none"
          stroke={ringColor}
          strokeWidth="3"
          style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.25))" }}
        />
      )}
      {/* Tail */}
      <path
        d="M16 40 L8 24 L24 24 Z"
        fill={f}
        stroke={s}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Head teardrop */}
      <path
        d="M16 2 C8.27 2 2 8.27 2 16 C2 24 16 24 16 24 C16 24 30 24 30 16 C30 8.27 23.73 2 16 2 Z"
        fill={f}
        stroke={s}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {renderIcon(type, ic)}
    </svg>
  );
}

function renderIcon(type: PinType, iconColor: string) {
  // Each inner icon is hand-tuned to fit the head's bounding box (16±12 each axis).
  switch (type) {
    case "default":
      return <circle cx="16" cy="14" r="4" fill={iconColor} />;
    case "school":
      return (
        <g
          transform="translate(7 8) scale(1.2)"
          fill="none"
          stroke={iconColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 11.5 V14.5 L12 16.5 L15 14.5 V11.5" />
          <path d="M9 11.5 L3 8.5 L12 4.5 L21 8.5 L15 11.5 L12 9.5 L9 11.5 Z" />
        </g>
      );
    case "hospital":
      return (
        <g transform="translate(8 7)" fill={iconColor}>
          <rect x="6" y="2" width="4" height="12" rx="0.5" />
          <rect x="2" y="6" width="12" height="4" rx="0.5" />
        </g>
      );
    case "pool":
      return (
        <g
          transform="translate(7 8)"
          fill="none"
          stroke={iconColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 6 Q5 3 8 6 T14 6" />
          <path d="M2 12 Q5 9 8 12 T14 12" />
          <path d="M2 3 Q5 0 8 3 T14 3" opacity="0.6" />
        </g>
      );
    case "library":
      return (
        <g
          transform="translate(7 8)"
          fill="none"
          stroke={iconColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 3 V14" />
          <path d="M9 3 C6 3 3 4 2 5 V15 C3 14 6 13 9 14" />
          <path d="M9 3 C12 3 15 4 16 5 V15 C15 14 12 13 9 14" />
        </g>
      );
    case "government":
      return (
        <g
          transform="translate(6 7)"
          fill="none"
          stroke={iconColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 17 H18" />
          <path d="M3 17 V9" />
          <path d="M7 17 V9" />
          <path d="M11 17 V9" />
          <path d="M15 17 V9" />
          <path d="M2 9 H18 L10 3 Z" />
          <path d="M1 9 H19" />
        </g>
      );
    case "other":
      return (
        <g transform="translate(11 6)" fill={iconColor}>
          <path d="M5 2 C3 2 1 3.5 1 5.5 H3 C3 4.5 4 4 5 4 C6 4 7 4.5 7 5.5 C7 7 5 7 5 9 H7 C7 6 9 5.5 9 4 C9 1.5 7 2 5 2 Z" />
          <circle cx="5" cy="11" r="1.2" />
        </g>
      );
  }
}

// Convenience exports — for callers that want the default fill of a type.
export const pinDefaults = TYPE_DEFAULTS;

// Helper: pick the right ring color for a given state.
export function ringColorForState(state: PinState): string | undefined {
  switch (state) {
    case "voted":     return "#C8102E"; // primary
    case "own":       return "#059669"; // success
    case "moderated": return "#D97706"; // warning
    case "anonymous": return "#6B7280"; // muted-500
    case "selected":  return "#1E3A8A"; // secondary (ring)
    default:          return undefined;
  }
}

export type PinState =
  | "default"
  | "hover"
  | "voted"
  | "own"
  | "moderated"
  | "anonymous"
  | "selected";