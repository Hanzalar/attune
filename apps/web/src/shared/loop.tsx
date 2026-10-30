import { ArrowRight, Bot, Check, RotateCcw } from "lucide-react";
import { TIMELINE, nextStep, progress, type Referral } from "@attune/domain";
import { act, resetDemo, viewUrl, type Action, type View } from "./store";
import { FONT, RADIUS, SIZE, T } from "../design/tokens";

const VIEWS: { id: View; label: string }[] = [
  { id: "patient", label: "Patient app" },
  { id: "pcp", label: "PCP admin" },
  { id: "specialist", label: "Specialist admin" },
];

/** Run an action and report the result through a toast; the rules' own message is shown when refused. */
export function useAct(show: (msg: string, error?: boolean) => void) {
  return (action: Action, ok?: string) => {
    const err = act(action);
    if (err) show(err, true);
    else if (ok) show(ok);
  };
}

/** Thin demo bar on every hosted view: which view this is, who acts next, links to the others, reset. Presenter-only. */
export function LoopBar({ r, here }: { r: Referral; here: View }) {
  const step = nextStep(r);
  const finished = ["closed", "declined", "withdrawn"].includes(r.stage);
  const pill = { borderRadius: RADIUS.sm, padding: "3px 10px", fontWeight: 600 } as const;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 py-2.5" style={{ fontSize: SIZE.xs + 1, color: T.textMuted }}>
      <a href={viewUrl("demo")} style={{ fontWeight: 600, color: T.text }}>Attune demo</a>
      <nav aria-label="Stakeholder views" className="flex flex-wrap gap-0.5 p-0.5" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: RADIUS.md }}>
        {VIEWS.map((v) => (
          <a key={v.id} href={viewUrl(v.id)} target={v.id === here ? undefined : `attune-${v.id}`} aria-current={v.id === here ? "page" : undefined}
            style={{ ...pill, background: v.id === here ? T.navy : "transparent", color: v.id === here ? T.textOnBrand : T.textMuted }}>
            {v.label}
          </a>
        ))}
      </nav>
      {finished ? (
        <span className="flex items-center gap-1.5" style={{ ...pill, background: T.successSoft, color: T.success }}><Check size={13} aria-hidden /> Loop finished</span>
      ) : step.view && step.view !== here ? (
        <a href={viewUrl(step.view)} target={`attune-${step.view}`} className="flex items-center gap-1.5" style={{ ...pill, background: T.warningSoft, color: T.warning }}>
          <Bot size={13} aria-hidden /> Next: {step.label} <ArrowRight size={13} aria-hidden />
        </a>
      ) : (
        <span className="flex items-center gap-1.5" style={{ ...pill, background: T.warningSoft, color: T.warning }}><Bot size={13} aria-hidden /> Your move: {step.label}</span>
      )}
      <button type="button" onClick={resetDemo} className="flex items-center gap-1" style={{ color: T.textMuted, cursor: "pointer" }}>
        <RotateCcw size={12} aria-hidden /> Reset demo
      </button>
      <span style={{ color: T.textSubtle, fontFamily: FONT.mono, fontSize: SIZE.xs }}>synthetic data · build {__BUILD_SHA__}</span>
    </div>
  );
}

/** The referral timeline: done steps are checked, the current one is marked and named "now". */
export function StageList({ r, compact }: { r: Referral; compact?: boolean }) {
  const at = progress(r.stage);
  const steps = TIMELINE.map((s) => ({ ...s, done: at >= progress(s.stage) }));
  const currentIdx = steps.findIndex((s) => !s.done);
  return (
    <ol className="flex flex-col">
      {steps.map((s, i) => {
        const current = i === currentIdx && at >= 0;
        return (
          <li key={s.stage} className="flex gap-3" aria-current={current ? "step" : undefined}>
            <div className="flex flex-col items-center">
              <div className="rounded-full flex items-center justify-center" style={{ width: 20, height: 20, flexShrink: 0, background: s.done ? T.success : T.surface, border: `2px solid ${s.done ? T.success : current ? T.brand : T.border}` }}>
                {s.done && <Check size={12} color={T.textOnBrand} aria-hidden />}
                {current && <span style={{ width: 8, height: 8, borderRadius: 9, background: T.brand }} />}
              </div>
              {i < steps.length - 1 && <div style={{ width: 2, flex: 1, minHeight: compact ? 10 : 16, background: s.done ? T.success : T.border }} />}
            </div>
            <div style={{ paddingBottom: compact ? 8 : 12, minWidth: 0 }}>
              <div className="flex flex-wrap items-center gap-2" style={{ fontSize: SIZE.sm + 1, fontWeight: current ? 600 : 500, color: s.done || current ? T.text : T.textSubtle }}>
                {s.label}
                {current && <span style={{ fontSize: SIZE.xs, fontWeight: 600, color: T.brand, textTransform: "uppercase", letterSpacing: "0.04em" }}>Now</span>}
              </div>
              {!compact && <div style={{ fontSize: SIZE.sm - 1, color: T.textMuted }}>{s.who}{s.done || current ? ` · ${s.note}` : ""}</div>}
            </div>
          </li>
        );
      })}
      {r.stage === "declined" && <li style={{ fontSize: SIZE.sm, color: T.danger, fontWeight: 600 }}>Declined by the specialist: {r.note}</li>}
      {r.stage === "withdrawn" && <li style={{ fontSize: SIZE.sm, color: T.danger, fontWeight: 600 }}>Withdrawn: consent revoked, nothing further is shared.</li>}
    </ol>
  );
}

const ROLE_LABEL: Record<string, string> = {
  patient: "Patient", pcp_ma: "PCP MA", pcp_physician: "PCP physician", specialist_staff: "Specialist front desk",
  specialist_provider: "Specialist provider", agent: "Attune agent",
};

/** Append-only audit trail. Every state change names who did it and what left Attune. */
export function ActivityLog({ r }: { r: Referral }) {
  if (r.log.length === 0) return <p style={{ fontSize: SIZE.sm, color: T.textMuted }}>No activity yet. The log starts when the patient makes a choice.</p>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="w-full" style={{ borderCollapse: "collapse", fontSize: SIZE.sm, minWidth: 520 }}>
        <thead>
          <tr style={{ textAlign: "left", color: T.textMuted, fontSize: SIZE.xs, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            <th className="py-2 pr-3" style={{ fontWeight: 600 }}>#</th><th className="py-2 pr-3" style={{ fontWeight: 600 }}>Time</th>
            <th className="py-2 pr-3" style={{ fontWeight: 600 }}>Actor</th><th className="py-2 pr-3" style={{ fontWeight: 600 }}>Event</th><th className="py-2" style={{ fontWeight: 600 }}>Shared</th>
          </tr>
        </thead>
        <tbody>
          {[...r.log].reverse().map((e) => (
            <tr key={e.seq} style={{ borderTop: `1px solid ${T.border}`, verticalAlign: "top" }}>
              <td className="py-2 pr-3 mono" style={{ color: T.textMuted }}>{e.seq}</td>
              <td className="py-2 pr-3 mono" style={{ color: T.textMuted, whiteSpace: "nowrap" }}>{new Date(e.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
              <td className="py-2 pr-3" style={{ fontWeight: 600, color: T.text, whiteSpace: "nowrap" }}>{ROLE_LABEL[e.by]}</td>
              <td className="py-2 pr-3" style={{ color: T.text }}>{e.summary}</td>
              <td className="py-2" style={{ color: T.textMuted }}>{e.shared?.join(", ") ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
