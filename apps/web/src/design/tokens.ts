/**
 * Attune design tokens: the handoff palette plus a few tints derived from it, each contrast-checked on Cream.
 * Rationale and rules live in apps/web/DESIGN.md. Views never use raw colors, fonts or radii.
 */
export const T = {
  // Handoff palette
  wine: "#5A1428", // Orchid Wine: headers, issue ink. 12.3:1 on cream.
  raspberry: "#8E3853", // Accent text, overlines, links. 6.8:1 on cream.
  dustyRose: "#AE6679", // Large type only (3.9:1 on cream).
  clay: "#C2A08B", // Decorative only (2.2:1). Never text.
  blush: "#F0C9C8", // Soft fills, focus halo, issue background.
  bone: "#F4EBE4", // App canvas.
  cream: "#FAF4EE", // Paper and panels.
  forest: "#2E3A2A", // Body text and primary buttons. 11:1 on cream.

  // Derived
  inkMuted: "#5B6355", // Secondary text, 5.7:1 on cream, 5.3:1 on bone.
  line: "#8F7E72", // Input and control borders, 3.6:1 on cream.
  hairline: "#E2D5CA", // Decorative dividers only.
  sage: "#E3E8DC", // "Done" background.
  sand: "#EFE2D6", // "Attention" background.
  sandInk: "#6E4E36", // "Attention" text, 5.9:1 on sand.
  white: "#FFFFFF",
  scrim: "rgba(46, 58, 42, .45)",
} as const;

export const FONT = {
  /** Voice: titles, asides, the note that proves we listened. Always italic. */
  serif: "'Instrument Serif', serif",
  /** Interface: everything people read to act. */
  sans: "'Instrument Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
} as const;

/** px. Patient screens never go below `sm` (14). `xs` is for dense clinician tables only. */
export const SIZE = { xs: 12, sm: 14, body: 16, md: 18, lg: 22, xl: 30, xxl: 42, display: 54 } as const;

export const RADIUS = { sm: 6, md: 10, lg: 16, phone: 28 } as const;

export const SHADOW = {
  paper: "drop-shadow(0 14px 12px rgba(90, 20, 40, .16)) drop-shadow(0 2px 2px rgba(46, 58, 42, .08))",
  card: "0 1px 2px rgba(46, 58, 42, .06), 0 8px 24px -16px rgba(90, 20, 40, .28)",
  overlay: "0 24px 60px -20px rgba(46, 58, 42, .45)",
} as const;

/** Status tones. The word always carries the meaning; color and icon only reinforce it. */
export const TONE = {
  neutral: { bg: T.bone, ink: T.forest, border: T.hairline },
  progress: { bg: T.cream, ink: T.raspberry, border: T.dustyRose },
  attention: { bg: T.sand, ink: T.sandInk, border: T.clay },
  issue: { bg: T.blush, ink: T.wine, border: T.dustyRose },
  done: { bg: T.sage, ink: T.forest, border: "#B9C4AE" },
} as const;

/** Check-in lines, distinguishable in grayscale by lightness. */
export const SERIES = { mood: T.wine, sleep: T.forest, energy: T.raspberry, skin: T.clay } as const;
