import { ArrowRight, Bot, Check, RotateCcw } from "lucide-react";
import { TIMELINE, nextStep, progress, type Referral } from "@attune/domain";
import { act, resetDemo, viewUrl, type Action, type View } from "./store";
import { C, MONO } from "./theme";

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

/** Thin bar on every hosted view: which view this is, who acts next, links to the others, reset. */
export function LoopBar({ r, here, dark }: { r: Referral; here: View; dark?: boolean }) {
  const step = nextStep(r);
  const finished = ["closed", "declined", "withdrawn"].includes(r.stage);
  const fg = dark ? C.clinSlate : C.slate;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 py-3" style={{ fontSize: 12, color: fg }}>
      <a href={viewUrl("home")} style={{ fontWeight: 700, color: dark ? C.clinInk : C.ink }}>Attune demo</a>
      <nav aria-label="Stakeholder views" className="flex flex-wrap gap-1 rounded-full p-1" style={{ background: "white", border: `1px solid ${dark ? C.clinLine : C.line}` }}>
        {VIEWS.map((v) => (
          <a key={v.id} href={viewUrl(v.id)} target={v.id === here ? undefined : `attune-${v.id}`} aria-current={v.id === here ? "page" : undefined}
            className="rounded-full px-3 py-1" style={{ background: v.id === here ? (dark ? C.clinInk : C.ink) : "transparent", color: v.id === here ? "white" : fg, fontWeight: 600 }}>
            {v.label}
          </a>
        ))}
      </nav>
      {finished ? (
        <span className="rounded-full px-3 py-1 flex items-center gap-1.5" style={{ background: C.greenSoft, color: C.green, fontWeight: 600 }}>
          <Check size={13} /> Loop finished
        </span>
      ) : step.view && step.view !== here ? (
        <a href={viewUrl(step.view)} target={`attune-${step.view}`} className="rounded-full px-3 py-1 flex items-center gap-1.5" style={{ background: C.amberSoft, color: C.amberInk, fontWeight: 600 }}>
          <Bot size={13} /> Next: {step.label} <ArrowRight size={13} />
        </a>
      ) : (
        <span className="rounded-full px-3 py-1 flex items-center gap-1.5" style={{ background: C.amberSoft, color: C.amberInk, fontWeight: 600 }}>
          <Bot size={13} /> Your move: {step.label}
        </span>
      )}
      <button onClick={resetDemo} className="flex items-center gap-1" style={{ color: fg, cursor: "pointer" }}>
        <RotateCcw size={12} /> Reset demo
      </button>
      <span style={{ color: C.slate2, fontFamily: MONO, fontSize: 11 }}>synthetic data · build {__BUILD_SHA__}</span>
    </div>
  );
}

export function StageList({ r, compact, light }: { r: Referral; compact?: boolean; light?: boolean }) {
  const ink = light ? C.clinInk : C.ink;
  const sub = light ? C.clinSlate : C.slate;
  const at = progress(r.stage);
  const steps = TIMELINE.map((s) => ({ ...s, done: at >= progress(s.stage) }));
  const currentIdx = steps.findIndex((s) => !s.done);
  return (
    <ol className="flex flex-col">
      {steps.map((s, i) => {
        const current = i === currentIdx && at >= 0;
        const dot = s.done ? C.green : current ? C.amber : light ? C.clinLine : C.line;
        return (
          <li key={s.stage} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="rounded-full flex items-center justify-center" style={{ width: 20, height: 20, background: s.done ? C.green : "white", border: `2px solid ${dot}`, flexShrink: 0 }}>
                {s.done && <Check size={12} color="white" />}
                {current && <span style={{ width: 6, height: 6, borderRadius: 9, background: C.amber }} />}
              </div>
              {i < steps.length - 1 && <div style={{ width: 2, flex: 1, minHeight: compact ? 12 : 18, background: s.done ? C.green : light ? C.clinLine : C.line }} />}
            </div>
            <div style={{ paddingBottom: compact ? 8 : 12, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: current ? 700 : 600, color: s.done || current ? ink : sub }}>{s.label}</div>
              {!compact && <div style={{ fontSize: 11.5, color: sub }}>{s.who}{s.done || current ? ` · ${s.note}` : ""}</div>}
            </div>
          </li>
        );
      })}
      {r.stage === "declined" && <li style={{ fontSize: 12.5, color: C.coralDeep, fontWeight: 600 }}>Declined by the specialist: {r.note}</li>}
      {r.stage === "withdrawn" && <li style={{ fontSize: 12.5, color: C.coralDeep, fontWeight: 600 }}>Withdrawn: consent revoked, nothing further is shared.</li>}
    </ol>
  );
}

const ROLE_LABEL: Record<string, string> = {
  patient: "Patient", pcp_ma: "PCP MA", pcp_physician: "PCP physician", specialist_staff: "Specialist front desk",
  specialist_provider: "Specialist provider", agent: "Attune agent",
};

/** Append-only audit trail. Every state change names who did it and what left Attune. */
export function ActivityLog({ r }: { r: Referral }) {
  if (r.log.length === 0) return <p style={{ fontSize: 12.5, color: C.clinSlate }}>No activity yet. The log starts when the patient approves sharing.</p>;
  return (
    <ol className="flex flex-col gap-1.5">
      {[...r.log].reverse().map((e) => (
        <li key={e.seq} className="rounded-lg px-3 py-2 flex flex-wrap items-baseline gap-x-3 gap-y-0.5" style={{ background: C.clinChip, fontSize: 12.5 }}>
          <span style={{ fontFamily: MONO, fontSize: 11, color: C.clinSlate }}>#{e.seq} {new Date(e.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          <span style={{ fontWeight: 700, color: C.clinInk }}>{ROLE_LABEL[e.by]}</span>
          <span style={{ color: C.clinInk }}>{e.summary}</span>
          {e.shared && <span style={{ color: C.clinSlate, fontSize: 11.5 }}>shared: {e.shared.join(", ")}</span>}
        </li>
      ))}
    </ol>
  );
}
