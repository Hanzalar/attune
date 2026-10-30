import { useCallback, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Check, CheckCircle2, CircleAlert, Info, XCircle, type LucideIcon } from "lucide-react";
import { ELEVATION, FONT, RADIUS, SIZE, T } from "../design/tokens";

/** Components of Attune Clinical UI. Rules for each live in apps/web/DESIGN.md. */

export function Eyebrow({ children, color = T.textMuted }: { children: ReactNode; color?: string }) {
  return <div className="uppercase" style={{ color, fontSize: SIZE.xs, fontWeight: 600, letterSpacing: "0.04em" }}>{children}</div>;
}

export function Label({ children, mt = 0 }: { children: ReactNode; mt?: number }) {
  return <div className="uppercase" style={{ fontSize: SIZE.xs, color: T.textMuted, letterSpacing: "0.04em", fontWeight: 600, marginTop: mt }}>{children}</div>;
}

type Tone = "plain" | "good" | "warn" | "flag" | "blue";
const TONES: Record<Tone, [bg: string, fg: string]> = {
  plain: [T.sunken, T.textMuted], good: [T.successSoft, T.success], warn: [T.warningSoft, T.warning],
  flag: [T.dangerSoft, T.danger], blue: [T.brandSoft, T.brandInk],
};

/** Small tag for sources, codes and counts. Statuses use StatusPill, which always carries an icon. */
export function Chip({ children, tone = "plain" }: { children: ReactNode; tone?: Tone }) {
  const [bg, fg] = TONES[tone];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5" style={{ background: bg, color: fg, fontSize: SIZE.xs, fontWeight: 600, borderRadius: RADIUS.sm, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";
const STATUS: Record<StatusTone, [bg: string, fg: string, Icon: LucideIcon]> = {
  neutral: [T.sunken, T.textMuted, Info], info: [T.brandSoft, T.brandInk, Info], success: [T.successSoft, T.success, CheckCircle2],
  warning: [T.warningSoft, T.warning, CircleAlert], danger: [T.dangerSoft, T.danger, XCircle],
};

/** Icon + word + tone, so state never depends on color alone. */
export function StatusPill({ tone, children, icon }: { tone: StatusTone; children: ReactNode; icon?: LucideIcon }) {
  const [bg, fg, Default] = STATUS[tone];
  const Icon = icon ?? Default;
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5" style={{ background: bg, color: fg, fontSize: SIZE.xs + 1, fontWeight: 600, borderRadius: RADIUS.sm, whiteSpace: "nowrap" }}>
      <Icon size={14} aria-hidden /> {children}
    </span>
  );
}

export function Notice({ tone = "info", title, children }: { tone?: Exclude<StatusTone, "neutral">; title?: string; children: ReactNode }) {
  const [bg, fg, Icon] = STATUS[tone];
  return (
    <div role="note" className="flex gap-3 px-4 py-3" style={{ background: bg, borderRadius: RADIUS.md, borderLeft: `4px solid ${fg}` }}>
      <Icon size={18} color={fg} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden />
      <div style={{ fontSize: SIZE.sm + 1, color: T.text, lineHeight: 1.5, minWidth: 0 }}>
        {title && <b style={{ display: "block", marginBottom: 2 }}>{title}</b>}
        {children}
      </div>
    </div>
  );
}

/** Patient-side container. */
export function Card({ children, pad = 16, selected }: { children: ReactNode; pad?: number; selected?: boolean }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${selected ? T.brand : T.border}`, boxShadow: selected ? `inset 0 0 0 1px ${T.brand}` : undefined, borderRadius: RADIUS.md, padding: pad, minWidth: 0 }}>
      {children}
    </div>
  );
}

/** Clinical container with a titled header row. */
export function Panel({ title, right, children }: { title: ReactNode; right?: ReactNode; children: ReactNode }) {
  return (
    <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: RADIUS.md, minWidth: 0 }}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
        <h2 style={{ fontSize: SIZE.body - 1, fontWeight: 600, color: T.text }}>{title}</h2>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function ClinHeader({ icon: Icon, title, sub, right }: { icon: LucideIcon; title: string; sub: string; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-4 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
      <div className="flex items-center justify-center" style={{ width: 40, height: 40, background: T.brandSoft, borderRadius: RADIUS.md, flexShrink: 0 }}>
        <Icon size={20} color={T.brand} aria-hidden />
      </div>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ color: T.text, fontSize: SIZE.lg, fontWeight: 600, lineHeight: 1.3 }}>{title}</h1>
        <div style={{ color: T.textMuted, fontSize: SIZE.sm }}>{sub}</div>
      </div>
      <div className="flex flex-wrap items-center gap-2 ml-auto">{right}</div>
    </div>
  );
}

export function Metric({ label, value, unit, note, tone }: { label: string; value: string; unit?: string; note: ReactNode; tone: "flag" | "watch" | "ok" }) {
  const col = tone === "flag" ? T.danger : tone === "watch" ? T.warning : T.success;
  return (
    <div className="p-3" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: RADIUS.md }}>
      <Label>{label}</Label>
      <div className="flex items-baseline gap-1 mt-1">
        <span style={{ fontFamily: FONT.mono, fontSize: SIZE.xl, color: T.text, fontWeight: 500 }} className="tnum">{value}</span>
        {unit && <span style={{ fontSize: SIZE.xs, color: T.textMuted, fontFamily: FONT.mono }}>{unit}</span>}
      </div>
      <div className="mt-1 flex items-center gap-1" style={{ fontSize: SIZE.xs + 1, color: col, fontWeight: 600 }}>{note}</div>
    </div>
  );
}

type ButtonKind = "primary" | "secondary" | "quiet" | "danger";

export function Button({ children, onClick, disabled, kind = "secondary", size = "md", full, label }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean; kind?: ButtonKind; size?: "md" | "lg"; full?: boolean; label?: string;
}) {
  const bg = disabled ? T.sunken : kind === "primary" ? T.brand : kind === "danger" ? T.danger : kind === "secondary" ? T.surface : "transparent";
  const fg = disabled ? T.textSubtle : kind === "primary" || kind === "danger" ? T.textOnBrand : T.brand;
  const border = kind === "secondary" && !disabled ? `1px solid ${T.borderStrong}` : "1px solid transparent";
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 ${full ? "w-full" : ""}`}
      style={{
        background: bg, color: fg, border, borderRadius: RADIUS.md, fontWeight: 600,
        fontSize: size === "lg" ? SIZE.body : SIZE.sm, minHeight: size === "lg" ? 48 : 36, padding: size === "lg" ? "0 20px" : "0 14px",
        cursor: disabled ? "not-allowed" : "pointer", textDecoration: kind === "quiet" ? "underline" : "none", textUnderlineOffset: 3,
      }}>
      {children}
    </button>
  );
}

/** A bookable time. Day on top, time below; the selected one fills with brand and shows a check. */
export function SlotButton({ day, time, selected, disabled, onClick }: { day: string; time: string; selected?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={selected} disabled={disabled} onClick={onClick} aria-label={`${day} at ${time}`}
      className="flex flex-col items-center justify-center"
      style={{
        minWidth: 84, minHeight: 52, padding: "6px 10px", borderRadius: RADIUS.md, cursor: disabled ? "not-allowed" : "pointer",
        background: selected ? T.brand : T.brandSoft, color: selected ? T.textOnBrand : T.brandInk,
        border: `1px solid ${selected ? T.brand : "transparent"}`, opacity: disabled && !selected ? 0.5 : 1,
      }}>
      <span style={{ fontSize: SIZE.xs, fontWeight: 600 }}>{day}</span>
      <span className="flex items-center gap-1 tnum" style={{ fontSize: SIZE.sm + 1, fontWeight: 600 }}>{selected && <Check size={14} aria-hidden />}{time}</span>
    </button>
  );
}

/** Numbered progress for a short flow. `current` is zero-based; steps before it show as done. */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <nav aria-label="Progress">
      <ol className="flex gap-1.5">
        {steps.map((s, i) => {
          const done = i < current;
          const on = i === current;
          return (
            <li key={s} className="flex-1" style={{ minWidth: 0 }} aria-current={on ? "step" : undefined}>
              <div style={{ height: 4, borderRadius: 2, background: done || on ? T.brand : T.border }} />
              <div className="flex items-center gap-1 mt-1.5" style={{ fontSize: SIZE.xs, fontWeight: on ? 600 : 500, color: on ? T.text : done ? T.textMuted : T.textSubtle }}>
                {done && <Check size={12} color={T.success} aria-hidden />}
                <span className="truncate">{s}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export interface ToastState { msg: string; error: boolean }

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const show = useCallback((msg: string, error = false) => {
    setToast({ msg, error });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), error ? 5200 : 2600);
  }, []);
  return [toast, show] as const;
}

export function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null;
  return (
    <div role="status" className="fixed left-1/2 -translate-x-1/2 z-50 px-4 py-3 flex items-center gap-2"
      style={{ bottom: "calc(88px + env(safe-area-inset-bottom, 0px))", background: toast.error ? T.danger : T.navy, color: T.textOnBrand, fontSize: SIZE.sm, fontWeight: 600, borderRadius: RADIUS.md, boxShadow: ELEVATION.overlay, maxWidth: "92vw" }}>
      {toast.error ? <AlertTriangle size={16} aria-hidden /> : <Check size={16} aria-hidden />} {toast.msg}
    </div>
  );
}

export function Tabs<V extends string>({ tabs, value, onChange }: { tabs: { id: V; label: string; count?: number }[]; value: V; onChange: (t: V) => void }) {
  return (
    <div role="tablist" className="flex flex-wrap gap-x-6 gap-y-1" style={{ borderBottom: `1px solid ${T.border}` }}>
      {tabs.map((t) => {
        const on = t.id === value;
        return (
          <button key={t.id} type="button" role="tab" aria-selected={on} onClick={() => onChange(t.id)} className="flex items-center gap-1.5 py-2.5"
            style={{ color: on ? T.brand : T.textMuted, borderBottom: `2px solid ${on ? T.brand : "transparent"}`, marginBottom: -1, fontSize: SIZE.sm, fontWeight: 600, cursor: "pointer" }}>
            {t.label}
            {t.count !== undefined && <span className="tnum" style={{ background: on ? T.brandSoft : T.sunken, borderRadius: RADIUS.sm, padding: "0 6px", fontSize: SIZE.xs }}>{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
