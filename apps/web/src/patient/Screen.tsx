/**
 * Patient screen shell: a header row (back arrow, or the wordmark on Home, plus the Record and Care team icons), a
 * title in the voice face, and a single column of content. `bloom` puts the title on an Orchid Wine band that fades
 * into code-drawn florals; the first card overlaps the fade.
 */
import type { CSSProperties, ReactNode } from "react";
import { ChevronLeft, FileText, Users } from "lucide-react";
import { SIZE, T } from "../design/tokens";
import { Bloom, Wordmark } from "../shared/Brand";
import { Overline, Voice } from "../shared/ui";
import { go } from "./nav";

function IconLink({ href, label, onDark, children }: { href: string; label: string; onDark: boolean; children: ReactNode }) {
  return (
    <a href={href} aria-label={label} title={label} className="inline-flex items-center justify-center" style={{ width: 44, height: 44, color: onDark ? T.cream : T.forest }}>
      {children}
    </a>
  );
}

function TopRow({ back, onDark }: { back: string | null; onDark: boolean }) {
  const ink = onDark ? T.cream : T.forest;
  return (
    <div className="flex items-center justify-between" style={{ minHeight: 52 }}>
      {back === null ? (
        <a href="#/" aria-label="Home" style={{ padding: "8px 0" }}><Wordmark size={24} onDark={onDark} /></a>
      ) : (
        <button type="button" onClick={() => go(back)} className="inline-flex items-center gap-1" style={{ minHeight: 44, color: ink, fontSize: SIZE.body, fontWeight: 500, cursor: "pointer", marginLeft: -6 }}>
          <ChevronLeft size={22} aria-hidden /> Back
        </button>
      )}
      <nav aria-label="Your record and care team" className="flex items-center" style={{ marginRight: -10 }}>
        <IconLink href="#/record" label="Your record" onDark={onDark}><FileText size={22} aria-hidden /></IconLink>
        <IconLink href="#/care" label="Your care team" onDark={onDark}><Users size={22} aria-hidden /></IconLink>
      </nav>
    </div>
  );
}

const pad = { paddingLeft: "max(16px, env(safe-area-inset-left))", paddingRight: "max(16px, env(safe-area-inset-right))" };

export function Screen({
  overline, title, sub, back = "/", bloom, children, foot,
}: {
  overline?: ReactNode; title: ReactNode; sub?: ReactNode; back?: string | null; bloom?: boolean; children: ReactNode; foot?: ReactNode;
}) {
  const hero = (onDark: boolean) => (
    <div style={{ paddingTop: 6 }}>
      {overline && <Overline onDark={onDark}>{overline}</Overline>}
      <Voice size={SIZE.xxl} color={onDark ? T.cream : T.forest} style={{ marginTop: overline ? 8 : 0 }}>{title}</Voice>
      {sub && <p style={{ fontSize: SIZE.body, lineHeight: 1.45, color: onDark ? T.blush : T.inkMuted, margin: "10px 0 0" }}>{sub}</p>}
    </div>
  );

  return (
    <div style={{ minHeight: "100%" }}>
      {bloom ? (
        <header style={{ position: "relative" }}>
          <Bloom variant="wine" style={{ position: "absolute", inset: 0 }} />
          <div className="grain" style={{ position: "relative", background: T.wine, ...pad, paddingBottom: 12 }}>
            <TopRow back={back} onDark />
            {hero(true)}
          </div>
          <div aria-hidden style={{ position: "relative", height: 112, backgroundImage: `linear-gradient(180deg, ${T.wine} 0%, transparent 100%)` }} />
        </header>
      ) : (
        <header style={{ ...pad, paddingBottom: 18 }}>
          <TopRow back={back} onDark={false} />
          {hero(false)}
        </header>
      )}
      <main className="flex flex-col gap-4" style={{ position: "relative", ...pad, marginTop: bloom ? -84 : 0, paddingBottom: foot ? 8 : "max(32px, env(safe-area-inset-bottom))" }}>
        {children}
      </main>
      {foot && (
        <Bloom variant="soft" style={{ ...pad, paddingTop: 36, paddingBottom: "max(56px, env(safe-area-inset-bottom))", marginTop: 8 }}>
          {foot}
        </Bloom>
      )}
    </div>
  );
}

/** Small section label inside a screen. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return <Overline style={{ marginTop: 8 }}>{children}</Overline>;
}

/** Plain body copy at the patient reading size. */
export function Body({ children, muted, style }: { children: ReactNode; muted?: boolean; style?: CSSProperties }) {
  return <p style={{ fontSize: SIZE.body, lineHeight: 1.5, color: muted ? T.inkMuted : T.forest, margin: 0, ...style }}>{children}</p>;
}

/** Secondary line, never below 14px. */
export function Small({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <p style={{ fontSize: SIZE.sm, lineHeight: 1.45, color: T.inkMuted, margin: 0, ...style }}>{children}</p>;
}
