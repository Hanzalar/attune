import { Check, ClipboardList, Printer, ShieldCheck, TrendingDown, X } from "lucide-react";
import { DEMO_EVIDENCE, DEMO_PATIENT, assessRotterdam, type CriterionStatus } from "@attune/domain";
import { C } from "./theme";
import { Chip } from "./ui";

export const EVIDENCE = assessRotterdam(DEMO_EVIDENCE);

export function StatusChip({ status }: { status: CriterionStatus }) {
  switch (status) {
    case "met": return <Chip tone="good">Met</Chip>;
    case "needs_labs": return <Chip tone="warn">Order labs</Chip>;
    case "clinician_review": return <Chip tone="blue">Your read</Chip>;
    case "not_met": return <Chip>Not met</Chip>;
    case "insufficient_data": return <Chip>Not enough data</Chip>;
  }
}

function Dot({ status }: { status: CriterionStatus }) {
  const bg = status === "met" ? C.green : status === "needs_labs" ? C.amber : C.clinChip;
  return (
    <div className="rounded-full flex items-center justify-center mt-0.5" style={{ width: 18, height: 18, flexShrink: 0, background: bg }}>
      {status === "met" ? <Check size={12} color="white" /> : status === "needs_labs" ? <span style={{ color: "white", fontSize: 11, fontWeight: 700 }}>?</span> : null}
    </div>
  );
}

export function Dossier({ close }: { close: () => void }) {
  return (
    <div role="dialog" aria-modal="true" aria-label="Clinician dossier" className="fixed inset-0 z-50 flex items-start justify-center overflow-auto py-8 px-4"
      style={{ background: "rgba(27,34,48,.55)", backdropFilter: "blur(3px)" }} onClick={close}>
      <div className="rounded-2xl w-full" style={{ maxWidth: 640, background: "white", boxShadow: "0 30px 80px -20px rgba(0,0,0,.5)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.clinLine}` }}>
          <div className="flex items-center gap-2">
            <ClipboardList size={18} color={C.coral} />
            <span style={{ fontSize: 15, fontWeight: 700, color: C.clinInk }}>Clinician dossier · Patient {DEMO_PATIENT.ref}</span>
          </div>
          <button onClick={close} aria-label="Close" style={{ cursor: "pointer" }}><X size={20} color={C.clinSlate} /></button>
        </div>
        <div className="px-6 py-5">
          <div className="rounded-lg p-3 mb-4 flex items-center gap-2" style={{ background: C.amberSoft }}>
            <ShieldCheck size={15} color={C.amber} />
            <span style={{ fontSize: 12, color: C.amberInk }}>Evidence for clinician review. Attune does not diagnose or prescribe.</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.clinSlate, textTransform: "uppercase", letterSpacing: 0.8 }}>Rotterdam criteria, mapped from patient data</div>
          <div className="mt-1">
            {EVIDENCE.criteria.map((c) => (
              <div key={c.id} className="flex items-start gap-3 py-2.5" style={{ borderBottom: `1px solid ${C.clinLine}` }}>
                <Dot status={c.status} />
                <div className="flex-1">
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.clinInk }}>{c.label}</div>
                  <div style={{ fontSize: 12, color: C.clinSlate }}>{c.detail}</div>
                </div>
                <Chip>{c.source}</Chip>
              </div>
            ))}
          </div>
          <div className="rounded-lg p-3 mt-3" style={{ background: C.clinChip, fontSize: 12.5, color: C.clinInk }}>{EVIDENCE.headline}</div>
          <div className="mt-5" style={{ fontSize: 12, fontWeight: 700, color: C.clinSlate, textTransform: "uppercase", letterSpacing: 0.8 }}>Current interventions and response</div>
          <div className="rounded-lg p-3 mt-2 flex gap-3" style={{ background: C.greenSoft }}>
            <TrendingDown size={18} color={C.green} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12.5, color: C.clinInk }}>Myo-inositol 4 g/d × 6 wk, 94% adherence → acne −4.0 pts, energy +4. Reassess at wk 8.</span>
          </div>
          <div className="mt-5" style={{ fontSize: 12, fontWeight: 700, color: C.clinSlate, textTransform: "uppercase", letterSpacing: 0.8 }}>Open gaps</div>
          <ul className="mt-2 flex flex-col gap-1.5">
            {EVIDENCE.gaps.map((g) => (
              <li key={g} className="flex items-center gap-2" style={{ fontSize: 12.5, color: C.clinInk }}>
                <span style={{ width: 5, height: 5, borderRadius: 9, background: C.coral }} /> {g}
              </li>
            ))}
          </ul>
          <div className="flex gap-2 mt-6">
            <button onClick={() => window.print()} className="rounded-lg px-4 py-2.5 flex items-center gap-2" style={{ background: C.coral, color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              <Printer size={15} /> Print or save as PDF
            </button>
            <button onClick={close} className="rounded-lg px-4 py-2.5" style={{ background: C.clinChip, color: C.clinInk, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
