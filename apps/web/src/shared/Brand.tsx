import type { CSSProperties, ReactNode } from "react";
import { PRODUCT_NAME } from "@attune/domain";
import { SIZE, T } from "../design/tokens";

/** Attune mark: a five-petal bloom drawn in code on Orchid Wine. The favicon carries the same drawing. */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden focusable="false">
      <rect width="32" height="32" rx="9" fill={T.wine} />
      <g transform="translate(16 16.5)" fill={T.blush}>
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="0" cy="-6" rx="3.6" ry="6" transform={`rotate(${a})`} opacity="0.92" />
        ))}
      </g>
      <circle cx="16" cy="16.5" r="2.6" fill={T.wine} />
    </svg>
  );
}

/** Wordmark: the mark plus the product name set in the voice face. */
export function Wordmark({ size = 26, onDark, sub }: { size?: number; onDark?: boolean; sub?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Mark size={size} />
      <span className="voice" style={{ fontSize: size * 0.95, color: onDark ? T.cream : T.forest, lineHeight: 1 }}>{PRODUCT_NAME}</span>
      {sub && <span style={{ fontSize: SIZE.sm, color: onDark ? T.blush : T.inkMuted, fontWeight: 500, borderLeft: `1px solid ${onDark ? "rgba(250,244,238,.35)" : T.hairline}`, paddingLeft: 8 }}>{sub}</span>}
    </span>
  );
}

/**
 * Florals drawn in code: soft out-of-focus blooms (radial gradients) under fine grain. They stand in for photography.
 * `wine` is the title band: solid Orchid Wine for the top 62% (cream text stays above 12:1), then a bloom fade into
 * Bone. Keep text in the solid part. `soft` is the light wash at the foot of a page.
 */
export function Bloom({ variant, children, style, className }: { variant: "wine" | "soft"; children?: ReactNode; style?: CSSProperties; className?: string }) {
  const wash =
    variant === "wine"
      ? `radial-gradient(40% 30% at 88% 22%, rgba(142,56,83,.55) 0%, rgba(142,56,83,0) 70%),
         radial-gradient(45% 28% at 12% 92%, rgba(240,201,200,.75) 0%, rgba(240,201,200,0) 70%),
         radial-gradient(40% 25% at 72% 96%, rgba(194,160,139,.5) 0%, rgba(194,160,139,0) 70%),
         linear-gradient(180deg, ${T.wine} 0%, ${T.wine} 62%, rgba(142,56,83,.82) 80%, rgba(244,235,228,0) 100%)`
      : `radial-gradient(55% 40% at 15% 85%, rgba(240,201,200,.85) 0%, rgba(240,201,200,0) 70%),
         radial-gradient(45% 35% at 80% 95%, rgba(174,102,121,.35) 0%, rgba(174,102,121,0) 70%),
         radial-gradient(40% 30% at 60% 70%, rgba(194,160,139,.3) 0%, rgba(194,160,139,0) 70%)`;
  return (
    <div className={`grain ${className ?? ""}`} style={{ backgroundImage: wash, backgroundColor: T.bone, ...style }}>
      {children}
    </div>
  );
}
