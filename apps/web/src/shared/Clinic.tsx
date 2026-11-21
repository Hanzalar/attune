/**
 * Clinician chrome shared by the PCP and specialist portals: the slim Orchid Wine top bar, hash routing, the
 * practice's in-app notices and a labelled checkbox. Plainer and denser than the patient app, same palette.
 */
import { useEffect, useState, type ReactNode } from "react";
import { Bell, X } from "lucide-react";
import type { World } from "@attune/domain";
import { RADIUS, SIZE, T } from "../design/tokens";
import { Wordmark } from "./Brand";
import { ago } from "./format";
import { Voice, Overline } from "./ui";

/** `#/patient/p-ari` → ["patient", "p-ari"]. */
export function useHashRoute(): string[] {
  const read = () => window.location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  const [parts, setParts] = useState(read);
  useEffect(() => {
    const on = () => {
      setParts(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return parts;
}

export function go(path: string) {
  window.location.hash = `#/${path}`;
}

export function TopBar({ sub, nav, here, right }: { sub: string; nav: { path: string; label: string }[]; here: string; right?: ReactNode }) {
  return (
    <header className="no-print grain" style={{ background: T.wine, color: T.cream }}>
      <div className="mx-auto flex flex-wrap items-center gap-x-6 gap-y-2" style={{ maxWidth: 1240, padding: "10px 16px" }}>
        <Wordmark onDark size={24} sub={sub} />
        <nav aria-label="Portal sections" className="flex flex-wrap gap-1">
          {nav.map((n) => (
            <a
              key={n.path} href={`#/${n.path}`} aria-current={n.path === here ? "page" : undefined}
              style={{ padding: "6px 10px", minHeight: 32, borderRadius: RADIUS.sm, fontSize: SIZE.sm, fontWeight: 600, color: T.cream, background: n.path === here ? "rgba(250,244,238,.16)" : "transparent", textDecoration: n.path === here ? "underline" : "none", textUnderlineOffset: 5 }}
            >
              {n.label}
            </a>
          ))}
        </nav>
        {right && <div className="flex flex-wrap items-center gap-2 sm:ml-auto">{right}</div>}
      </div>
    </header>
  );
}

/** Page heading: overline plus a serif title. The only place the clinician portals use the voice face. */
export function PageTitle({ over, title, children }: { over: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3" style={{ margin: "20px 0 16px" }}>
      <div>
        <Overline style={{ fontSize: SIZE.xs }}>{over}</Overline>
        <Voice size={SIZE.xl} style={{ marginTop: 4 }}>{title}</Voice>
      </div>
      {children}
    </div>
  );
}

/** A demo-only select in the top bar, e.g. who is signed in or which practice the front desk works for. */
export function DemoSelect<V extends string>({ label, value, options, onChange }: { label: string; value: V; options: { value: V; label: string }[]; onChange: (v: V) => void }) {
  return (
    <label className="flex items-center gap-2" style={{ fontSize: SIZE.xs, color: T.blush }}>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value as V)} style={{ minHeight: 32, borderRadius: RADIUS.sm, border: `1px solid ${T.blush}`, background: T.cream, color: T.forest, fontSize: SIZE.sm, padding: "4px 8px" }}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function CheckRow({ id, checked, onChange, label, detail }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: ReactNode; detail?: string }) {
  return (
    <label htmlFor={id} className="flex items-start gap-2.5" style={{ cursor: "pointer", fontSize: SIZE.sm, color: T.forest, padding: "6px 0" }}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 18, height: 18, marginTop: 1, accentColor: T.forest, flexShrink: 0 }} />
      <span>
        <span style={{ fontWeight: 600 }}>{label}</span>
        {detail && <span style={{ display: "block", color: T.inkMuted }}>{detail}</span>}
      </span>
    </label>
  );
}

function readDismissed(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]") as string[];
  } catch {
    return [];
  }
}

/** The practice's in-app notices, newest first, each dismissible. No badges or counters. */
export function PracticeNotices({ w, practiceId, now, max = 3 }: { w: World; practiceId: string; now: string; max?: number }) {
  const key = `attune.dismissed.${practiceId}`;
  const [dismissed, setDismissed] = useState<string[]>(() => readDismissed(key));
  const list = w.notices
    .filter((n) => n.to.kind === "practice" && n.to.id === practiceId && !dismissed.includes(n.id))
    .slice(-max)
    .reverse();
  if (list.length === 0) return null;
  const dismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Storage blocked: the notice stays hidden for this page view only.
    }
  };
  return (
    <div className="no-print flex flex-col gap-2" role="region" aria-label="Updates for your practice" style={{ marginTop: 16 }}>
      {list.map((n) => (
        <div key={n.id} className="flex items-center gap-3" style={{ background: T.cream, border: `1px solid ${T.hairline}`, borderLeft: `3px solid ${T.raspberry}`, borderRadius: RADIUS.sm, padding: "8px 12px", fontSize: SIZE.sm }}>
          <Bell size={15} aria-hidden style={{ color: T.raspberry, flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{n.text}</span>
          <span style={{ color: T.inkMuted, whiteSpace: "nowrap" }}>{ago(n.at, now)}</span>
          <button type="button" onClick={() => dismiss(n.id)} aria-label="Dismiss update" style={{ minWidth: 32, minHeight: 32, display: "inline-flex", alignItems: "center", justifyContent: "center", color: T.inkMuted, cursor: "pointer" }}>
            <X size={15} aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return <main className="mx-auto" style={{ maxWidth: 1240, padding: "0 16px 48px" }}>{children}</main>;
}
