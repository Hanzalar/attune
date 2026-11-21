/**
 * Attune's shared kit. Every surface builds from these, so the patient app, the PCP portal and the specialist portal
 * read as one product: the patient side generous and editorial, the clinician side plainer and denser.
 */
import { useCallback, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Check, Circle, CircleDot, Clock, Info, TriangleAlert, X } from "lucide-react";
import type { Command, Tone } from "@attune/domain";
import { FONT, RADIUS, SHADOW, SIZE, T, TONE } from "../design/tokens";
import { act } from "./store";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/** Spaced capitals, Raspberry on light, Blush on Orchid Wine. */
export function Overline({ children, onDark, style }: { children: ReactNode; onDark?: boolean; style?: CSSProperties }) {
  return (
    <p style={{ fontSize: SIZE.sm, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600, color: onDark ? T.blush : T.raspberry, margin: 0, ...style }}>
      {children}
    </p>
  );
}

/** The voice: Instrument Serif Italic. Used for titles and short human lines, never for instructions. */
export function Voice({ as: Tag = "h1", size = SIZE.xxl, color = T.forest, children, style }: { as?: "h1" | "h2" | "h3" | "p" | "span"; size?: number; color?: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <Tag className="voice" style={{ fontSize: size, lineHeight: 1.05, color, margin: 0, ...style }}>
      {children}
    </Tag>
  );
}

/** A small aside in her ink: Raspberry serif italic. Encouragement and acknowledgement, never advice. */
export function Ink({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <p className="voice" style={{ fontSize: SIZE.lg, lineHeight: 1.2, color: T.raspberry, margin: 0, ...style }}>
      {children}
    </p>
  );
}

type ButtonVariant = "primary" | "secondary" | "quiet" | "onDark";
const BUTTON: Record<ButtonVariant, CSSProperties> = {
  primary: { background: T.forest, color: T.cream, border: `1px solid ${T.forest}` },
  secondary: { background: "transparent", color: T.forest, border: `1px solid ${T.forest}` },
  quiet: { background: "transparent", color: T.raspberry, border: "1px solid transparent", textDecoration: "underline", textUnderlineOffset: 3 },
  onDark: { background: T.cream, color: T.wine, border: `1px solid ${T.cream}` },
};

export function Button({
  children, onClick, variant = "primary", size = "lg", full, icon, disabled, type = "button", style, ariaLabel,
}: {
  children: ReactNode; onClick?: () => void; variant?: ButtonVariant; size?: "lg" | "md" | "sm"; full?: boolean; icon?: ReactNode;
  disabled?: boolean; type?: "button" | "submit"; style?: CSSProperties; ariaLabel?: string;
}) {
  const pad = size === "lg" ? "15px 22px" : size === "md" ? "10px 16px" : "6px 12px";
  const minHeight = size === "lg" ? 54 : size === "md" ? 44 : 32;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="inline-flex items-center justify-center gap-2"
      style={{
        ...BUTTON[variant], padding: pad, minHeight, borderRadius: RADIUS.sm, fontFamily: FONT.sans, fontWeight: 600,
        fontSize: size === "sm" ? SIZE.sm : SIZE.body, width: full ? "100%" : undefined, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1, letterSpacing: "0.01em", ...style,
      }}
    >
      {icon}
      {children}
    </button>
  );
}

const TONE_ICON: Record<Tone, typeof Check> = { neutral: Circle, progress: CircleDot, attention: Clock, issue: TriangleAlert, done: Check };

/** Status: icon + word + tone. The word carries the meaning; color never does alone. */
export function StatusPill({ tone, label, size = "md" }: { tone: Tone; label: string; size?: "md" | "sm" }) {
  const Icon = TONE_ICON[tone];
  const t = TONE[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap"
      style={{ background: t.bg, color: t.ink, border: `1px solid ${t.border}`, borderRadius: RADIUS.sm, padding: size === "sm" ? "1px 7px" : "3px 9px", fontSize: size === "sm" ? SIZE.xs : SIZE.sm, fontWeight: 600, letterSpacing: "0.02em" }}
    >
      <Icon size={size === "sm" ? 12 : 14} aria-hidden strokeWidth={2.4} />
      {label}
    </span>
  );
}

/** Small label chip, e.g. a source or a mode. Not a status. */
export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "rose" }) {
  return (
    <span style={{ display: "inline-block", fontSize: SIZE.sm, fontWeight: 600, letterSpacing: "0.02em", padding: "2px 8px", borderRadius: RADIUS.sm, background: tone === "rose" ? T.blush : T.bone, color: tone === "rose" ? T.wine : T.forest }}>
      {children}
    </span>
  );
}

/** Deterministic torn bottom edge, so paper looks hand-torn but never jitters between renders. */
function tornPath(seed: number): string {
  const pts: string[] = ["0% 0%", "100% 0%"];
  let x = 100;
  let n = seed * 9301 + 49297;
  while (x > 0) {
    n = (n * 9301 + 49297) % 233280;
    const r = n / 233280;
    pts.push(`${x.toFixed(1)}% calc(100% - ${(r * 9).toFixed(1)}px)`);
    x -= 2.2 + r * 2.6;
  }
  pts.push("0% calc(100% - 4px)");
  return `polygon(${pts.join(", ")})`;
}

/** Cream paper with a torn bottom edge and a soft shadow. The patient app's main surface. */
export function Paper({ children, torn = true, seed = 1, style, className }: { children: ReactNode; torn?: boolean; seed?: number; style?: CSSProperties; className?: string }) {
  return (
    <div style={{ filter: SHADOW.paper }} className={className}>
      <div className="paper grain" style={{ clipPath: torn ? tornPath(seed) : undefined, borderRadius: torn ? `${RADIUS.sm}px ${RADIUS.sm}px 0 0` : RADIUS.sm, padding: torn ? "18px 18px 26px" : 18, ...style }}>
        {children}
      </div>
    </div>
  );
}

/** Clinician container: titled header row, optional meta and actions, body. */
export function Panel({ title, meta, actions, children, pad = true, style }: { title?: ReactNode; meta?: ReactNode; actions?: ReactNode; children: ReactNode; pad?: boolean; style?: CSSProperties }) {
  return (
    <section style={{ background: T.cream, border: `1px solid ${T.hairline}`, borderRadius: RADIUS.md, boxShadow: SHADOW.card, ...style }}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2" style={{ padding: "12px 16px", borderBottom: `1px solid ${T.hairline}` }}>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {title && <h2 style={{ fontSize: SIZE.body, fontWeight: 600, color: T.forest, margin: 0 }}>{title}</h2>}
            {meta && <span style={{ fontSize: SIZE.sm, color: T.inkMuted }}>{meta}</span>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div style={{ padding: pad ? 16 : 0 }}>{children}</div>
    </section>
  );
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} style={{ fontSize: SIZE.sm, fontWeight: 600, color: T.forest }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: SIZE.sm, color: T.inkMuted }}>{hint}</span>}
    </div>
  );
}

export const inputStyle: CSSProperties = {
  border: `1px solid ${T.line}`, borderRadius: RADIUS.sm, background: T.white, color: T.forest, padding: "10px 12px",
  fontSize: SIZE.body, fontFamily: FONT.sans, minHeight: 44, width: "100%",
};

/** Switch with a label and a plain-language consequence. */
export function Toggle({ on, onChange, label, detail, id }: { on: boolean; onChange: (on: boolean) => void; label: string; detail?: string; id: string }) {
  return (
    <div className="flex items-center justify-between gap-4" style={{ padding: "12px 0", borderBottom: `1px solid ${T.hairline}` }}>
      <label htmlFor={id} className="flex flex-col" style={{ cursor: "pointer" }}>
        <span style={{ fontSize: SIZE.body, fontWeight: 600, color: T.forest }}>{label}</span>
        {detail && <span style={{ fontSize: SIZE.sm, color: T.inkMuted }}>{detail}</span>}
      </label>
      <button
        id={id} type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)}
        style={{ width: 52, height: 30, borderRadius: 15, flexShrink: 0, background: on ? T.forest : T.hairline, border: `1px solid ${on ? T.forest : T.line}`, position: "relative", cursor: "pointer" }}
      >
        <span style={{ position: "absolute", top: 3, left: on ? 25 : 3, width: 22, height: 22, borderRadius: 11, background: T.cream, transition: "left .15s" }} />
        <span className="sr-only">{on ? "On" : "Off"}</span>
      </button>
    </div>
  );
}

/** Selectable chip; selected is a Forest fill with a check, so state isn't color alone. */
export function Chip({ selected, onClick, children, disabled }: { selected: boolean; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button" aria-pressed={selected} onClick={onClick} disabled={disabled}
      className="inline-flex items-center gap-1.5"
      style={{ minHeight: 44, padding: "8px 14px", borderRadius: RADIUS.sm, fontSize: SIZE.body, fontWeight: 500, background: selected ? T.forest : "transparent", color: selected ? T.cream : T.forest, border: `1px solid ${selected ? T.forest : T.line}`, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1 }}
    >
      {selected && <Check size={15} aria-hidden strokeWidth={2.6} />}
      {children}
    </button>
  );
}

/** Five open circles; the chosen one fills. Labelled ends say what low and high mean. */
export function Dots({ label, value, onChange, low, high }: { label: string; value: number | null; onChange: (v: number) => void; low: string; high: string }) {
  return (
    <fieldset style={{ border: 0, padding: "12px 0", margin: 0, borderBottom: `1px solid ${T.hairline}` }}>
      <legend style={{ fontSize: SIZE.md, fontWeight: 600, color: T.forest, padding: 0, marginBottom: 8 }}>{label}</legend>
      <div className="flex items-center justify-between gap-2" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${label} ${n} of 5${n === 1 ? `, ${low}` : n === 5 ? `, ${high}` : ""}`}
            onClick={() => onChange(n)}
            style={{ width: 46, height: 46, borderRadius: 23, border: `1.5px solid ${T.forest}`, background: value === n ? T.forest : "transparent", cursor: "pointer" }}
          />
        ))}
      </div>
      <div className="flex justify-between" style={{ fontSize: SIZE.sm, color: T.inkMuted, marginTop: 4 }}>
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </fieldset>
  );
}

export function formatLeft(msLeft: number): string {
  const s = Math.max(0, Math.ceil(msLeft / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
}

/** Time left on a hold, as digits and a bar. The digits are the signal; the bar only echoes them. */
export function Countdown({ msLeft, totalMs, onDark }: { msLeft: number; totalMs: number; onDark?: boolean }) {
  const pct = totalMs > 0 ? Math.max(0, Math.min(1, msLeft / totalMs)) : 0;
  return (
    <div role="timer" aria-live="off" aria-label={`${formatLeft(msLeft)} left on the hold`}>
      <div className="flex items-baseline gap-2">
        <span className="tnum" style={{ fontSize: SIZE.xl, fontWeight: 600, color: onDark ? T.cream : T.forest, fontFamily: FONT.sans }}>{formatLeft(msLeft)}</span>
        <span style={{ fontSize: SIZE.sm, color: onDark ? T.blush : T.inkMuted }}>left on your hold</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: onDark ? "rgba(250,244,238,.25)" : T.hairline, marginTop: 8, overflow: "hidden" }}>
        <div style={{ width: `${pct * 100}%`, height: "100%", background: onDark ? T.blush : T.raspberry, transition: "width 1s linear" }} />
      </div>
    </div>
  );
}

/** Inline banner for context or a rule. */
export function Notice({ tone = "neutral", title, children }: { tone?: Tone; title?: string; children: ReactNode }) {
  const t = TONE[tone];
  const Icon = tone === "issue" ? TriangleAlert : tone === "done" ? Check : tone === "attention" ? Clock : Info;
  return (
    <div role={tone === "issue" ? "alert" : "note"} className="flex gap-2.5" style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: RADIUS.sm, padding: "10px 12px", color: t.ink, fontSize: SIZE.sm, lineHeight: 1.45 }}>
      <Icon size={17} aria-hidden style={{ flexShrink: 0, marginTop: 1 }} />
      <div>
        {title && <p style={{ fontWeight: 600, margin: "0 0 2px" }}>{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}

/** Label/value rows for dense clinician detail. */
export function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid" style={{ gridTemplateColumns: "minmax(110px, 34%) 1fr", columnGap: 12, rowGap: 6, fontSize: SIZE.sm, margin: 0 }}>
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt style={{ color: T.inkMuted }}>{k}</dt>
          <dd style={{ color: T.forest, margin: 0, overflowWrap: "anywhere" }}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export const th: CSSProperties = { textAlign: "left", fontSize: SIZE.xs, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: T.inkMuted, padding: "8px 12px", borderBottom: `1px solid ${T.hairline}`, whiteSpace: "nowrap" };
export const td: CSSProperties = { fontSize: SIZE.sm, color: T.forest, padding: "10px 12px", borderBottom: `1px solid ${T.hairline}`, verticalAlign: "top" };

/** Bottom-center confirmation of the last action. Refusals stay longer and use the rule's own words. */
export function useToast(): [ReactNode, (msg: string, error?: boolean) => void] {
  const [toast, setToast] = useState<{ msg: string; error: boolean } | null>(null);
  const timer = useRef<number>();
  const show = useCallback((msg: string, error = false) => {
    window.clearTimeout(timer.current);
    setToast({ msg, error });
    timer.current = window.setTimeout(() => setToast(null), error ? 7000 : 3200);
  }, []);
  const node = toast ? (
    <div role={toast.error ? "alert" : "status"} className="no-print fixed left-1/2 flex items-center gap-3" style={{ bottom: "max(20px, env(safe-area-inset-bottom))", transform: "translateX(-50%)", zIndex: 60, maxWidth: "min(92vw, 520px)", background: toast.error ? T.wine : T.forest, color: T.cream, padding: "12px 16px", borderRadius: RADIUS.sm, boxShadow: SHADOW.overlay, fontSize: SIZE.sm, lineHeight: 1.4 }}>
      {toast.error ? <TriangleAlert size={17} aria-hidden /> : <Check size={17} aria-hidden />}
      <span>{toast.msg}</span>
      <button type="button" onClick={() => setToast(null)} aria-label="Dismiss" style={{ color: T.cream, cursor: "pointer", padding: 4 }}>
        <X size={15} aria-hidden />
      </button>
    </div>
  ) : null;
  return [node, show];
}

/** Run a command; show the rule's refusal as a toast, or an optional confirmation. Returns true when it ran. */
export function useAct(show: (msg: string, error?: boolean) => void) {
  return useCallback(
    (cmd: Command, ok?: string): boolean => {
      const err = act(cmd);
      if (err) show(err, true);
      else if (ok) show(ok);
      return err === null;
    },
    [show],
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p style={{ fontSize: SIZE.sm, color: T.inkMuted, padding: "12px 0", margin: 0 }}>{children}</p>;
}
