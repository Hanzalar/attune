import { ClipboardList, Printer, TrendingDown, X } from "lucide-react";
import { DEMO_EVIDENCE, DEMO_PATIENT, assessRotterdam, type CriterionStatus } from "@attune/domain";
import { ELEVATION, RADIUS, SIZE, T } from "../design/tokens";
import { Button, Chip, Label, Notice, StatusPill } from "./ui";

export const EVIDENCE = assessRotterdam(DEMO_EVIDENCE);

export function StatusChip({ status }: { status: CriterionStatus }) {
  switch (status) {
    case "met": return <StatusPill tone="success">Met</StatusPill>;
    case "needs_labs": return <StatusPill tone="warning">Order labs</StatusPill>;
    case "clinician_review": return <StatusPill tone="info">Your read</StatusPill>;
    case "not_met": return <StatusPill tone="neutral">Not met</StatusPill>;
    case "insufficient_data": return <StatusPill tone="neutral">Not enough data</StatusPill>;
  }
}

export function Dossier({ close }: { close: () => void }) {
  const section = (title: string) => <div style={{ marginTop: 20 }}><Label>{title}</Label></div>;
  return (
    <div role="dialog" aria-modal="true" aria-label="Clinician dossier" className="fixed inset-0 z-50 flex items-start justify-center overflow-auto py-8 px-4"
      style={{ background: T.scrim }} onClick={close}>
      <div className="w-full" style={{ maxWidth: 680, background: T.surface, borderRadius: RADIUS.lg, boxShadow: ELEVATION.overlay }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 px-6 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
            <ClipboardList size={18} color={T.brand} aria-hidden />
            <span style={{ fontSize: SIZE.body, fontWeight: 600, color: T.text }}>Clinician dossier</span>
            <span className="mono" style={{ fontSize: SIZE.sm, color: T.textMuted }}>{DEMO_PATIENT.ref}</span>
          </div>
          <button type="button" onClick={close} aria-label="Close" style={{ cursor: "pointer", padding: 6 }}><X size={20} color={T.textMuted} /></button>
        </div>
        <div className="px-6 py-5">
          <Notice tone="warning">Evidence for clinician review. Attune does not diagnose or prescribe.</Notice>
          {section("Rotterdam criteria, mapped from patient data")}
          <div className="mt-1">
            {EVIDENCE.criteria.map((c) => (
              <div key={c.id} className="flex flex-wrap items-start gap-x-3 gap-y-1.5 py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
                <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                  <div style={{ fontSize: SIZE.sm, fontWeight: 600, color: T.text }}>{c.label}</div>
                  <div style={{ fontSize: SIZE.sm - 1, color: T.textMuted }}>{c.detail}</div>
                </div>
                <div className="flex flex-wrap gap-1.5"><Chip>{c.source}</Chip><StatusChip status={c.status} /></div>
              </div>
            ))}
          </div>
          <p className="px-3 py-2.5 mt-3" style={{ background: T.sunken, borderRadius: RADIUS.md, fontSize: SIZE.sm, color: T.text }}>{EVIDENCE.headline}</p>
          {section("Current interventions and response")}
          <div className="flex gap-3 px-3 py-2.5 mt-2" style={{ background: T.successSoft, borderRadius: RADIUS.md }}>
            <TrendingDown size={18} color={T.success} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden />
            <span style={{ fontSize: SIZE.sm, color: T.text }}>Myo-inositol 4 g/d × 6 wk, 94% adherence → acne −4.0 pts, energy +4. Reassess at wk 8.</span>
          </div>
          {section("Open gaps")}
          <ul className="mt-2 flex flex-col gap-1.5" style={{ listStyle: "disc", paddingLeft: 20 }}>
            {EVIDENCE.gaps.map((g) => <li key={g} style={{ fontSize: SIZE.sm, color: T.text }}>{g}</li>)}
          </ul>
          <div className="flex flex-wrap gap-2 mt-6">
            <Button kind="primary" onClick={() => window.print()}><Printer size={15} aria-hidden /> Print or save as PDF</Button>
            <Button onClick={close}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
