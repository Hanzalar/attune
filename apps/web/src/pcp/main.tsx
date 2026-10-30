import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Bot, Check, Clock, Download, FileCheck2, ListChecks, ShieldCheck, UserCheck } from "lucide-react";
import {
  DEMO_EVIDENCE, DEMO_MANUAL_QUEUE, DEMO_PATIENT, DEMO_PCP, DEMO_SHARE_ITEMS, DEMO_SPECIALISTS,
  assessRotterdam, draftCodes, reached, referralRequirement, type PlanType, type Referral, type Stage,
} from "@attune/domain";
import "../index.css";
import { ActivityLog, LoopBar, useAct } from "../shared/loop";
import { useReferral } from "../shared/store";
import { C, MONO } from "../shared/theme";
import { Button, Chip, ClinHeader, Label, Panel, Tabs, Toast, useToast } from "../shared/ui";

const CODES = draftCodes(assessRotterdam(DEMO_EVIDENCE), DEMO_EVIDENCE, { acne: true });
type Tab = "queue" | "specialists" | "settings" | "activity";

function queueStatus(r: Referral) {
  if (r.stage === "draft") return "Waiting on patient";
  if (r.stage === "awaiting_pcp") return "Ready to sign";
  if (r.stage === "awaiting_physician") return "Needs physician co-sign";
  return r.stage === "declined" ? "Declined by specialist" : r.stage === "withdrawn" ? "Withdrawn by patient" : "Signed";
}

function ReferralDetail({ r, show }: { r: Referral; show: (m: string, e?: boolean) => void }) {
  const run = useAct(show);
  const [codes, setCodes] = useState<string[]>(CODES.map((c) => c.code));
  const m = DEMO_SPECIALISTS.find((s) => s.id === r.specialistId);
  const req = referralRequirement(r.plan);
  const ma = DEMO_PCP.staff.find((s) => s.role === "pcp_ma")!;
  const doc = DEMO_PCP.staff.find((s) => s.role === "pcp_physician")!;
  const signer = r.stage === "awaiting_physician" ? doc : ma;
  const canSign = r.stage === "awaiting_pcp" || r.stage === "awaiting_physician";
  const shared = DEMO_SHARE_ITEMS.filter((i) => r.share[i.key]);
  const after: [string, Stage][] = [["Delivered with receipt", "sent"], ["Received, slot offered", "offered"], ["Visit booked", "booked"], ["Seen, notes back", "closed"]];
  const ev = assessRotterdam(DEMO_EVIDENCE);
  const ovul = ev.criteria[0]!;

  return (
    <div className="flex flex-col gap-4" style={{ minWidth: 0 }}>
      <Panel title={`${DEMO_PATIENT.ref} · referral to ${r.toSpecialty}`}
        right={reached(r, "signed") ? <Chip tone="good"><Check size={11} /> Signed</Chip> : canSign ? <Chip tone="warn">Needs your sign-off</Chip> : <Chip>Waiting on patient approval</Chip>}>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <div style={{ minWidth: 0 }}>
            <Label>Reason (drafted by agent)</Label>
            <p style={{ fontSize: 12.5, color: C.clinInk, marginTop: 4, lineHeight: 1.45 }}>
              {DEMO_PATIENT.age} y. {ovul.detail} {ev.criteria[1]!.detail} {ev.supporting.join("; ")}. {ev.gaps[0]} not yet on file. Patient asks for a PMOS workup and plan.
            </p>
            <Label mt={12}>Draft ICD-10-CM codes · confirm before signing</Label>
            <div className="flex flex-col gap-1.5 mt-1.5">
              {CODES.map((c) => (
                <label key={c.code} className="flex items-start gap-2" style={{ fontSize: 12.5, color: C.clinInk, cursor: canSign ? "pointer" : "default" }}>
                  <input type="checkbox" disabled={!canSign} checked={codes.includes(c.code)} style={{ marginTop: 3, accentColor: C.blue }}
                    onChange={() => setCodes(codes.includes(c.code) ? codes.filter((x) => x !== c.code) : [...codes, c.code])} />
                  <span><span style={{ fontFamily: MONO, fontWeight: 600, background: C.clinChip, borderRadius: 4, padding: "1px 6px" }}>{c.code}</span> {c.display}
                    <span style={{ display: "block", fontSize: 11, color: C.clinSlate }}>{c.why}</span></span>
                </label>
              ))}
            </div>
            <p style={{ fontSize: 11, color: C.clinSlate, marginTop: 6 }}>Symptoms are coded, not a suspected diagnosis. E28.2 is drafted only when PMOS is already on the problem list.</p>
            <Label mt={12}>Plan</Label>
            <p style={{ fontSize: 12.5, color: C.clinInk, marginTop: 4 }}>
              {r.plan} · {req.referralRequired ? "referral required" : "referral not required"} · {req.physicianSignature ? "physician signature required" : "MA sign-off"} · verify the member's plan
            </p>
          </div>
          <div style={{ minWidth: 0 }}>
            <Label>Specialist (patient's pick)</Label>
            {m && (
              <div className="rounded-lg p-3 mt-1.5" style={{ background: C.clinChip }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.clinInk }}>{m.name}</div>
                <div style={{ fontSize: 11.5, color: C.clinSlate }}>{m.practice} · runs {m.ehr}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Chip tone="good"><ShieldCheck size={11} /> In network</Chip>
                  {m.routes.fax?.verified && <Chip tone="good"><Check size={11} /> Fax verified</Chip>}
                  {m.routes.direct && <Chip tone="blue"><Check size={11} /> Direct (360X)</Chip>}
                  <Chip tone="good"><Check size={11} /> NPI matched</Chip>
                </div>
                <div className="tnum" style={{ fontFamily: MONO, fontSize: 11.5, color: C.clinSlate, marginTop: 8 }}>
                  {m.routes.direct ? `Direct ${m.routes.direct}` : `Fax ${m.routes.fax?.number}`} · NPI {m.npi}
                </div>
              </div>
            )}
            <Label mt={12}>Packet (patient-approved)</Label>
            <div className="flex flex-col gap-1.5 mt-1.5">
              {shared.map((i) => (
                <div key={i.key} className="flex items-center justify-between gap-2" style={{ fontSize: 12.5, color: C.clinInk }}>
                  <span className="flex items-center gap-1.5"><FileCheck2 size={13} color={C.green} /> {i.title}</span><Chip>{i.source}</Chip>
                </div>
              ))}
            </div>
            {(r.signatures.ma || r.signatures.physician) && (
              <p style={{ fontSize: 11.5, color: C.clinSlate, marginTop: 10 }}>
                Signed by {[r.signatures.ma, r.signatures.physician].filter(Boolean).join(" and ")}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 pt-4" style={{ borderTop: `1px solid ${C.clinLine}` }}>
          <Button kind="primary" disabled={!canSign}
            onClick={() => run({ type: "signReferral", by: signer.role, codes, signer: signer.name },
              r.stage === "awaiting_pcp" && req.physicianSignature ? "Signed. Sent to the physician for co-sign" : "Signed. Packet delivered with receipt")}>
            <UserCheck size={15} /> {reached(r, "signed") ? "Signed and sent" : r.stage === "awaiting_physician" ? `Co-sign as ${doc.name}` : `Sign off as ${ma.name}`}
          </Button>
          <Button onClick={() => window.print()}><Download size={14} /> PDF for your EMR</Button>
        </div>
        {r.stage === "draft" && <p style={{ fontSize: 11.5, color: C.clinSlate, marginTop: 8 }}>Unlocks after the patient approves sharing in her app.</p>}
      </Panel>

      <Panel title="After sending" right={<span style={{ fontSize: 11, color: C.clinSlate }}>no more lost referrals</span>}>
        <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
          {after.map(([l, s]) => {
            const done = reached(r, s);
            return (
              <div key={l} className="rounded-lg p-3" style={{ background: done ? C.greenSoft : C.clinChip }}>
                <div className="flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 700, color: done ? C.green : C.clinSlate }}>{done ? <Check size={13} /> : <Clock size={13} />} {done ? "Done" : "Pending"}</div>
                <div style={{ fontSize: 12, color: C.clinInk, marginTop: 4 }}>{l}</div>
              </div>
            );
          })}
        </div>
        {r.stage === "declined" && <p style={{ fontSize: 12.5, color: C.coralDeep, marginTop: 10 }}>Declined: {r.note}</p>}
        {r.outcome && <p style={{ fontSize: 12.5, color: C.clinInk, marginTop: 10 }}><b>Outcome:</b> {r.outcome}</p>}
      </Panel>
    </div>
  );
}

function TrustedSpecialists() {
  const [paused, setPaused] = useState<Record<string, boolean>>({ ortiz: true });
  return (
    <Panel title="Trusted specialists" right={<span style={{ fontSize: 11, color: C.clinSlate }}>practice-level list, replaces the filing cabinet</span>}>
      <div className="flex flex-col gap-2">
        {DEMO_SPECIALISTS.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center gap-2.5 rounded-lg p-2.5" style={{ background: C.clinChip }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: C.clinInk }}>{s.name}</div>
              <div style={{ fontSize: 11, color: C.clinSlate }}>{s.specialty} · {s.practice} · {s.fitNote} · {s.ehr}</div>
            </div>
            {s.routes.fax && !s.routes.fax.verified && <Chip tone="flag">Fax unverified</Chip>}
            <button onClick={() => setPaused({ ...paused, [s.id]: !paused[s.id] })} style={{ cursor: "pointer" }} aria-pressed={!paused[s.id]}>
              {paused[s.id] ? <Chip tone="warn">Paused</Chip> : <Chip tone="good">Referring</Chip>}
            </button>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11.5, color: C.clinSlate, marginTop: 10 }}>Pausing hides a specialist from your patients' matches. It never reorders the others, and payment to Attune never affects order.</p>
    </Panel>
  );
}

function Settings() {
  const plans: PlanType[] = ["HMO", "POS", "EPO", "PPO"];
  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
      <Panel title="Practice" right={<Chip>read-only in the demo</Chip>}>
        <dl className="grid grid-cols-[140px_1fr] gap-y-2" style={{ fontSize: 12.5, color: C.clinInk }}>
          <dt style={{ color: C.clinSlate }}>Practice</dt><dd>{DEMO_PCP.practice}</dd>
          <dt style={{ color: C.clinSlate }}>EMR</dt><dd>{DEMO_PCP.ehr} · export the packet as PDF into the chart</dd>
          <dt style={{ color: C.clinSlate }}>Fax</dt><dd className="tnum">{DEMO_PCP.fax}</dd>
          <dt style={{ color: C.clinSlate }}>Direct address</dt><dd>{DEMO_PCP.direct ?? "None yet. Your EMR vendor can issue one."}</dd>
        </dl>
        <Label mt={14}>Who can sign</Label>
        <div className="flex flex-col gap-1.5 mt-1.5">
          {DEMO_PCP.staff.map((s) => (
            <div key={s.name} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: C.clinChip, fontSize: 12.5 }}>
              <span style={{ color: C.clinInk, fontWeight: 600 }}>{s.name}</span>
              <span style={{ color: C.clinSlate }}>{s.title} · {s.role === "pcp_physician" ? "signs any referral" : "signs where the plan allows"}</span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Plan rules the agent drafts with" right={<Chip tone="warn">defaults · verify per member</Chip>}>
        <table className="w-full" style={{ fontSize: 12.5, borderCollapse: "collapse" }}>
          <thead><tr style={{ color: C.clinSlate, fontSize: 11, textAlign: "left" }}><th className="py-1.5">Plan</th><th>Referral</th><th>Signer</th><th>Out of network</th></tr></thead>
          <tbody>
            {plans.map((p) => {
              const q = referralRequirement(p);
              return (
                <tr key={p} style={{ borderTop: `1px solid ${C.clinLine}`, color: C.clinInk }}>
                  <td className="py-1.5" style={{ fontWeight: 700 }}>{p}</td>
                  <td>{q.referralRequired ? "Required" : "Not required"}</td>
                  <td>{q.physicianSignature ? "Physician" : "MA"}</td>
                  <td>{q.outOfNetworkExcluded ? "Not covered" : "Covered at a higher cost"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function PcpApp() {
  const r = useReferral();
  const [toast, show] = useToast();
  const [tab, setTab] = useState<Tab>("queue");
  const status = useMemo(() => queueStatus(r), [r]);
  return (
    <div style={{ background: C.clinBg, minHeight: "100vh", padding: "0 16px" }}>
      <LoopBar r={r} here="pcp" dark />
      <div className="mx-auto pb-10" style={{ maxWidth: 1180 }}>
        <ClinHeader icon={ListChecks} title="Referral queue" sub={`${DEMO_PCP.practice} · medical assistant and physician view`}
          right={<><Chip tone="blue"><Bot size={11} /> 1 drafted by Attune</Chip><Chip>{DEMO_MANUAL_QUEUE.length} manual</Chip></>} />
        <Tabs value={tab} onChange={setTab} tabs={[{ id: "queue", label: "Queue" }, { id: "specialists", label: "Trusted specialists" }, { id: "settings", label: "Practice settings" }, { id: "activity", label: "Activity log" }]} />
        <div className="mt-4">
          {tab === "queue" && (
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-[300px_1fr]">
              <Panel title="Today's referrals" right={<span style={{ fontSize: 11, color: C.clinSlate }}>{DEMO_MANUAL_QUEUE.length + 1} open</span>}>
                <div className="flex flex-col gap-2">
                  <div className="rounded-lg p-3" style={{ background: C.blueSoft, border: `1.5px solid ${C.blue}` }}>
                    <div className="flex items-center justify-between gap-2">
                      <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: C.clinInk }}>{DEMO_PATIENT.ref}</span>
                      <Chip tone="blue"><Bot size={11} /> Attune</Chip>
                    </div>
                    <div style={{ fontSize: 12.5, color: C.clinInk, marginTop: 4 }}>OB/GYN: oligomenorrhea, hirsutism, PMOS workup</div>
                    <div style={{ fontSize: 11, color: C.clinSlate, marginTop: 2 }}>{status}</div>
                  </div>
                  {DEMO_MANUAL_QUEUE.map((q) => (
                    <button key={q.id} onClick={() => show("Manual referral: built by hand today")} className="text-left rounded-lg p-3" style={{ background: C.clinChip, cursor: "pointer" }}>
                      <div className="flex items-center justify-between gap-2">
                        <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: C.clinInk }}>{q.id}</span><Chip>Manual</Chip>
                      </div>
                      <div style={{ fontSize: 12.5, color: C.clinInk, marginTop: 4 }}>{q.to}: {q.reason}</div>
                      <div style={{ fontSize: 11, color: C.clinSlate, marginTop: 2 }}>{q.status}</div>
                    </button>
                  ))}
                </div>
              </Panel>
              <ReferralDetail r={r} show={show} />
            </div>
          )}
          {tab === "specialists" && <TrustedSpecialists />}
          {tab === "settings" && <Settings />}
          {tab === "activity" && <Panel title="Activity log" right={<Chip>append-only</Chip>}><ActivityLog r={r} /></Panel>}
        </div>
      </div>
      <Toast toast={toast} />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><PcpApp /></StrictMode>);
