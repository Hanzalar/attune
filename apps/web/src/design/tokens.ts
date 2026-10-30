/**
 * Attune Clinical UI tokens. The single source for color, type, radius and elevation in every view.
 * Rationale and usage rules: apps/web/DESIGN.md. Status colors never carry meaning alone; pair them with an icon and a label.
 */
export const T = {
  canvas: "#F3F5F8",
  surface: "#FFFFFF",
  sunken: "#EEF1F5",
  border: "#D3DAE3",
  borderStrong: "#7D8A9A",

  text: "#101A28",
  textMuted: "#4A5869",
  textSubtle: "#5C6875",
  textOnBrand: "#FFFFFF",

  brand: "#0B5E8E",
  brandHover: "#084A70",
  brandSoft: "#E6F0F7",
  brandInk: "#073B59",
  navy: "#0F2338",

  success: "#17714A",
  successSoft: "#E4F3EB",
  warning: "#8A5A00",
  warningSoft: "#FFF3D6",
  danger: "#B3261E",
  dangerSoft: "#FCE9E7",

  focus: "#F2A900",
  scrim: "rgba(15, 35, 56, .55)",
} as const;

export const FONT = {
  sans: "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace",
} as const;

/** Type scale in px. Patient screens use `body` (16) as the floor for reading text; clinical tables use `sm` (14). */
export const SIZE = { xs: 12, sm: 14, body: 16, md: 18, lg: 20, xl: 24, xxl: 30, display: 38 } as const;

export const RADIUS = { sm: 4, md: 6, lg: 10 } as const;

export const ELEVATION = {
  raised: "0 1px 2px rgba(16, 26, 40, .06), 0 1px 3px rgba(16, 26, 40, .08)",
  overlay: "0 18px 48px -12px rgba(16, 26, 40, .35)",
} as const;

/** Chart series in fixed order, each distinguishable in grayscale by lightness. */
export const SERIES = ["#0B5E8E", "#9FB7CC", "#B3261E", "#17714A"] as const;
