import { ELEVATION, RADIUS, SIZE, T } from "../design/tokens";

/** A captured 390x844 patient-app screen, framed like a phone. */
export function Phone({ src, alt, caption, max = 260 }: { src: string; alt: string; caption?: string; max?: number }) {
  return (
    <figure className="flex flex-col items-center gap-2" style={{ margin: 0, minWidth: 0 }}>
      <img src={src} alt={alt} width={390} height={844} loading="lazy"
        style={{ width: "100%", maxWidth: max, height: "auto", borderRadius: RADIUS.lg * 2, border: `6px solid ${T.navy}`, boxShadow: ELEVATION.overlay, background: T.canvas }} />
      {caption && <figcaption style={{ fontSize: SIZE.sm, color: T.textMuted, textAlign: "center", maxWidth: max }}>{caption}</figcaption>}
    </figure>
  );
}
