import { useCallback, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Check, type LucideIcon } from "lucide-react";
import { C, MONO } from "./theme";

export function Eyebrow({ children, color = C.coral }: { children: ReactNode; color?: string }) {
  return <div className="uppercase" style={{ color, fontSize: 11, fontWeight: 700, letterSpacing: 1.5 }}>{children}</div>;
}

export function Label({ children, mt = 0 }: { children: ReactNode; mt?: number }) {
  return (
    <div style={{ fontSize: 10.5, color: C.clinSlate, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700, marginTop: mt }}>
      {children}
    </div>
  );
}

type Tone = "plain" | "good" | "warn" | "flag" | "blue";
const TONES: Record<Tone, [string, string]> = {
  plain: [C.clinChip, C.clinSlate], good: [C.greenSoft, C.green], warn: [C.amberSoft, C.amber],
  flag: [C.coralSoft, C.coralDeep], blue: [C.blueSoft, C.blue],
};

export function Chip({ children, tone = "plain" }: { children: ReactNode; tone?: Tone }) {
  const [bg, fg] = TONES[tone];
  return (
    <span className="rounded px-2 py-0.5 inline-flex items-center gap-1" style={{ background: bg, color: fg, fontSize: 10.5, fontWeight: 700, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

export function Panel({ title, right, children }: { title: ReactNode; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl" style={{ background: C.clinCard, border: `1px solid ${C.clinLine}`, minWidth: 0 }}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5" style={{ borderBottom: `1px solid ${C.clinLine}` }}>
        <h2 style={{ fontSize: 12.5, fontWeight: 700, color: C.clinInk, letterSpacing: 0.2 }}>{title}</h2>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function ClinHeader({ icon: Icon, title, sub, right }: { icon: LucideIcon; title: string; sub: string; right?: ReactNode }) {
  return (
    <div className="rounded-xl px-5 py-4 flex flex-wrap items-center gap-4" style={{ background: C.clinInk }}>
      <div className="rounded-full flex items-center justify-center" style={{ width: 44, height: 44, background: C.headerIcon, flexShrink: 0 }}>
        <Icon size={20} color="white" />
      </div>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ color: "white", fontSize: 17, fontWeight: 700 }}>{title}</h1>
        <div style={{ color: C.headerSub, fontSize: 12.5 }}>{sub}</div>
      </div>
      <div className="flex flex-wrap items-center gap-2 ml-auto">{right}</div>
    </div>
  );
}

export function Metric({ label, value, unit, note, tone }: { label: string; value: string; unit?: string; note: ReactNode; tone: "flag" | "watch" | "ok" }) {
  const col = tone === "flag" ? C.coralDeep : tone === "watch" ? C.amber : C.green;
  return (
    <div className="rounded-lg p-3" style={{ background: C.clinCard, border: `1px solid ${C.clinLine}` }}>
      <div style={{ fontSize: 10.5, color: C.clinSlate, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }}>{label}</div>
      <div className="flex items-baseline gap-1 mt-1">
        <span style={{ fontFamily: MONO, fontSize: 22, color: C.clinInk, fontWeight: 600 }}>{value}</span>
        {unit && <span style={{ fontSize: 11, color: C.clinSlate, fontFamily: MONO }}>{unit}</span>}
      </div>
      <div className="mt-1 flex items-center gap-1" style={{ fontSize: 11, color: col, fontWeight: 600 }}>{note}</div>
    </div>
  );
}

export function Button({ children, onClick, disabled, kind = "secondary", color }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean; kind?: "primary" | "secondary"; color?: string;
}) {
  const primary = kind === "primary";
  return (
    <button disabled={disabled} onClick={onClick} className="rounded-md px-4 py-2 flex items-center gap-2"
      style={{
        background: disabled ? C.clinLine : primary ? color ?? C.blue : C.clinChip,
        color: disabled ? C.clinSlate : primary ? "white" : C.clinInk,
        fontWeight: primary ? 700 : 600, fontSize: 13, cursor: disabled ? "not-allowed" : "pointer",
      }}>
      {children}
    </button>
  );
}

export interface ToastState { msg: string; error: boolean }

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const show = useCallback((msg: string, error = false) => {
    setToast({ msg, error });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), error ? 4200 : 2400);
  }, []);
  return [toast, show] as const;
}

export function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null;
  return (
    <div role="status" className="fixed left-1/2 -translate-x-1/2 z-50 rounded-full px-4 py-2.5 flex items-center gap-2"
      style={{ bottom: "calc(20px + env(safe-area-inset-bottom, 0px))", background: toast.error ? C.coralDeep : C.clinInk, color: "white", fontSize: 13, fontWeight: 600, boxShadow: "0 10px 30px -10px rgba(0,0,0,.4)", maxWidth: "92vw" }}>
      {toast.error ? <AlertTriangle size={15} /> : <Check size={15} />} {toast.msg}
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div role="tablist" className="flex flex-wrap gap-1 mt-4">
      {tabs.map((t) => {
        const on = t.id === value;
        return (
          <button key={t.id} role="tab" aria-selected={on} onClick={() => onChange(t.id)} className="rounded-md px-3 py-1.5"
            style={{ background: on ? C.clinInk : C.clinCard, color: on ? "white" : C.clinSlate, border: `1px solid ${on ? C.clinInk : C.clinLine}`, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
