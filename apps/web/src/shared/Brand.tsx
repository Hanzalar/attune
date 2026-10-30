import { SIZE, T } from "../design/tokens";

/** Attune mark: three tuned levels on a brand tile. The landing branch carries the same SVG. */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden focusable="false">
      <rect width="28" height="28" rx="6" fill={T.brand} />
      <rect x="7" y="11" width="3" height="10" rx="1.5" fill="#fff" />
      <rect x="12.5" y="7" width="3" height="14" rx="1.5" fill="#fff" />
      <rect x="18" y="13" width="3" height="8" rx="1.5" fill="#fff" />
    </svg>
  );
}

export function Wordmark({ size = 28, sub }: { size?: number; sub?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Mark size={size} />
      <span style={{ fontSize: size * 0.68, fontWeight: 600, color: T.text, letterSpacing: "-0.01em" }}>Attune</span>
      {sub && <span style={{ fontSize: SIZE.xs + 1, color: T.textMuted, fontWeight: 500, borderLeft: `1px solid ${T.border}`, paddingLeft: 8 }}>{sub}</span>}
    </span>
  );
}
