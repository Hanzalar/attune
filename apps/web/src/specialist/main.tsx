import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Bar, BarChart, CartesianGrid, ComposedChart, Line, LineChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { AlertTriangle, Download, Inbox as InboxIcon, ShieldCheck, Stethoscope, TrendingDown } from "lucide-react";
import {
  DEMO_EVIDENCE, DEMO_PATIENT, DEMO_SERIES, DEMO_SPECIALISTS, MFG_DEFAULT_THRESHOLD, draftCodes, toFhirBundle, type Referral,
} from "@attune/domain";
import "../index.css";
import { Dossier, EVIDENCE } from "../shared/Dossier";
import { ActivityLog, LoopBar, useAct } from "../shared/loop";
import { useReferral } from "../shared/store";
import { C, MONO } from "../shared/theme";
import { Button, Chip, ClinHeader, Metric, Panel, Tabs, Toast, useToast } from "../shared/ui";
import { CancellationFill, Inbox, WhereItLives } from "./Inbox";

type Tab = "inbox" | "provider" | "settings" | "activity";
const cycles = DEMO_EVIDENCE.cycleLengths.map((len, i) => ({ c: `Cycle ${i + 1}`, len }));

function ProviderConsole({ r, show, openDossier }: { r: Referral; show: (m: string, e?: boolean) => void; openDossier: () => void }) {
  const run = useAct(show);
  const latestMfg = DEMO_EVIDENCE.mfgScores.at(-1);
  return (
    <div>
      <div className="rounded-xl px-5 py-4 flex flex-wrap items-center gap-4" style={{ background: C.clinInk }}>
        <div className="rounded-full flex items-center justify-center" style={{ width: 44, height: 44, background: C.headerIcon }}><span style={{ fontFamily: MONO, color: "white", fontSize: 15 }}>MK</span></div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span style={{ color: "white", fontSize: 17, fontWeight: 700 }}>Patient {DEMO_PATIENT.ref}</span>
            <span className="rounded px-2 py-0.5" style={{ background: C.coral, color: "white", fontSize: 10.5, fontWeight: 700 }}>PMOS workup · under review</span>
          </div>
          <span style={{ color: C.headerSub, fontSize: 12.5 }}>{DEMO_PATIENT.age} y · {DEMO_PATIENT.phenotype.toLowerCase()} pattern · {DEMO_PATIENT.daysTracked} days of structured data</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <span className="rounded-md px-2.5 py-1.5 flex items-center gap-1.5" style={{ background: C.headerChip, color: "#B9C4D2", fontSize: 11.5 }}><ShieldCheck size={13} /> Decision support, not a diagnosis</span>
          <button onClick={openDossier} className="rounded-md px-3 py-1.5 flex items-center gap-1.5" style={{ background: C.coral, color: "white", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}><Download size={14} /> Dossier</button>
        </div>
      </div>
      <div className="grid gap-3 mt-4 grid-cols-2 md:grid-cols-4">
        <Metric label="mFG hirsutism" value={String(latestMfg)} unit="/ 36" note={<><TrendingDown size={12} /> ≥{MFG_DEFAULT_THRESHOLD} = hirsutism · easing</>} tone="watch" />
        <Metric label="Cycle length" value={`${Math.min(...DEMO_EVIDENCE.cycleLengths)}–${Math.max(...DEMO_EVIDENCE.cycleLengths)}`} unit="d" note={<><AlertTriangle size={12} /> oligomenorrhea</>} tone="flag" />
        <Metric label="HOMA-IR" value={String(DEMO_EVIDENCE.labs.homaIr)} note={<><AlertTriangle size={12} /> elevated (&gt;2.5)</>} tone="flag" />
        <Metric label="Domains supported" value={`${EVIDENCE.domainsMet} / 3`} note={<>imaging not read by Attune</>} tone="watch" />
      </div>
      <div className="grid gap-4 mt-4 grid-cols-1 lg:grid-cols-[1.35fr_1fr]">
        <div className="flex flex-col gap-4" style={{ minWidth: 0 }}>
          <Panel title="Validated instruments, trend" right={<span style={{ fontSize: 11, color: C.clinSlate }}>modified Ferriman-Gallwey</span>}>
            <div style={{ height: 150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={DEMO_SERIES.mfg} margin={{ top: 6, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid stroke={C.clinLine} vertical={false} />
                  <XAxis dataKey="m" tick={{ fontSize: 11, fill: C.clinSlate }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 16]} tick={{ fontSize: 10, fill: C.clinSlate }} axisLine={false} tickLine={false} />
                  <ReferenceLine y={MFG_DEFAULT_THRESHOLD} stroke={C.coral} strokeDasharray="4 4" label={{ value: "2023 guideline threshold", fontSize: 10, fill: C.coralDeep, position: "insideTopRight" }} />
                  <Line type="monotone" dataKey="score" stroke={C.clinInk} strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title="Menstrual cycle length" right={<span style={{ fontSize: 11, color: C.clinSlate }}>last {cycles.length} cycles · Attune tracker</span>}>
            <div style={{ height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cycles} margin={{ top: 6, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid stroke={C.clinLine} vertical={false} />
                  <XAxis dataKey="c" tick={{ fontSize: 10, fill: C.clinSlate }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 70]} tick={{ fontSize: 10, fill: C.clinSlate }} axisLine={false} tickLine={false} />
                  <ReferenceLine y={35} stroke={C.coral} strokeDasharray="4 4" label={{ value: "35d", fontSize: 10, fill: C.coralDeep, position: "insideTopRight" }} />
                  <Bar dataKey="len" radius={[4, 4, 0, 0]} fill="#8593A6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p style={{ fontSize: 11.5, color: C.clinSlate, marginTop: 6 }}>{EVIDENCE.criteria[0]!.detail}</p>
          </Panel>
        </div>
        <div className="flex flex-col gap-4" style={{ minWidth: 0 }}>
          <Panel title="Intervention response (N-of-1)" right={<Chip tone="good">signal detected</Chip>}>
            <div style={{ height: 132 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={DEMO_SERIES.trial} margin={{ top: 6, right: 4, left: -26, bottom: 0 }}>
                  <CartesianGrid stroke={C.clinLine} vertical={false} />
                  <XAxis dataKey="wk" tick={{ fontSize: 9, fill: C.clinSlate }} axisLine={false} tickLine={false} interval={2} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: C.clinSlate }} axisLine={false} tickLine={false} />
                  <ReferenceLine x="W4" stroke={C.plum} strokeDasharray="3 3" label={{ value: "inositol", fontSize: 9, fill: C.plum, position: "top" }} />
                  <Bar dataKey="adh" barSize={9} radius={[2, 2, 0, 0]} fill="#D6DCE6" />
                  <Line type="monotone" dataKey="acne" stroke={C.coral} strokeWidth={2.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title="Open gaps for this visit" right={<span style={{ fontSize: 10.5, color: C.clinSlate }}>Intl. PCOS/PMOS Guideline 2023</span>}>
            <ul className="flex flex-col gap-2">
              {EVIDENCE.gaps.map((g) => (
                <li key={g} className="flex gap-2.5 rounded-lg p-2.5" style={{ background: C.clinChip, fontSize: 12.5, color: C.clinInk }}>
                  <span style={{ width: 6, borderRadius: 6, background: C.coralDeep, flexShrink: 0 }} /> {g}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Record the visit">
            <p style={{ fontSize: 12, color: C.clinSlate }}>When the visit is done, the outcome goes back to the referring PCP and the patient's plan.</p>
            <div className="mt-3">
              <Button kind="primary" disabled={r.stage !== "booked"}
                onClick={() => run({ type: "completeVisit", by: "specialist_provider", outcome: "Androgen and exclusion labs ordered; inositol continued; follow-up in 6 weeks." }, "Outcome sent back to the PCP")}>
                <Stethoscope size={15} /> {r.stage === "booked" ? "Visit done, send outcome" : r.outcome ? "Outcome sent" : "Available once booked"}
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function IntakeSettings({ r }: { r: Referral }) {
  const s = DEMO_SPECIALISTS.find((x) => x.id === r.specialistId) ?? DEMO_SPECIALISTS[0]!;
  const displays = Object.fromEntries(draftCodes(EVIDENCE, DEMO_EVIDENCE, { acne: true }).map((c) => [c.code, c.display]));
  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1fr_1.2fr]">
      <div className="flex flex-col gap-4">
        <Panel title="How you receive referrals" right={<Chip>read-only in the demo</Chip>}>
          <dl className="grid grid-cols-[120px_1fr] gap-y-2" style={{ fontSize: 12.5, color: C.clinInk }}>
            <dt style={{ color: C.clinSlate }}>Practice</dt><dd>{s.practice}</dd>
            <dt style={{ color: C.clinSlate }}>EHR</dt><dd>{s.ehr}</dd>
            <dt style={{ color: C.clinSlate }}>Fax</dt><dd>{s.routes.fax ? `${s.routes.fax.number} · ${s.routes.fax.verified ? "verified" : "unverified"}` : "none"}</dd>
            <dt style={{ color: C.clinSlate }}>Direct (360X)</dt><dd>{s.routes.direct ?? "none"}</dd>
            <dt style={{ color: C.clinSlate }}>FHIR inbox</dt><dd>{s.routes.fhir ?? "v2: SMART on FHIR app"}</dd>
            <dt style={{ color: C.clinSlate }}>NPI</dt><dd className="tnum">{s.npi}</dd>
          </dl>
        </Panel>
        <WhereItLives />
      </div>
      <Panel title="This referral as FHIR (BSeR ServiceRequest + Task + Consent)" right={<Chip tone="blue">what a FHIR inbox receives</Chip>}>
        <pre style={{ fontFamily: MONO, fontSize: 11, color: C.clinInk, background: C.clinChip, borderRadius: 8, padding: 12, maxHeight: 460, overflow: "auto" }}>
          {JSON.stringify(toFhirBundle(r, s, displays), null, 2)}
        </pre>
      </Panel>
    </div>
  );
}

function SpecialistApp() {
  const r = useReferral();
  const [toast, show] = useToast();
  const [tab, setTab] = useState<Tab>("inbox");
  const [dossier, setDossier] = useState(false);
  const practice = DEMO_SPECIALISTS.find((s) => s.id === r.specialistId)?.practice ?? "Your practice";
  return (
    <div style={{ background: C.clinBg, minHeight: "100vh", padding: "0 16px" }}>
      <LoopBar r={r} here="specialist" dark />
      <div className="mx-auto pb-10" style={{ maxWidth: 1180 }}>
        <ClinHeader icon={InboxIcon} title="New referrals" sub={`${practice} (example OB/GYN) · front desk and provider`}
          right={<><Chip tone="good">Pre-qualified only</Chip><button onClick={() => setTab("provider")} className="rounded-md px-3 py-1.5 flex items-center gap-1.5" style={{ background: C.headerChip, color: "#D7DEE8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}><Stethoscope size={13} /> Provider console</button></>} />
        <Tabs value={tab} onChange={setTab} tabs={[{ id: "inbox", label: "Inbox" }, { id: "provider", label: "Provider console" }, { id: "settings", label: "Intake settings" }, { id: "activity", label: "Activity log" }]} />
        <div className="mt-4">
          {tab === "inbox" && (
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1.4fr_1fr]">
              <div style={{ minWidth: 0 }}><Inbox r={r} show={show} /></div>
              <div className="flex flex-col gap-4" style={{ minWidth: 0 }}><CancellationFill r={r} show={show} /><WhereItLives /></div>
            </div>
          )}
          {tab === "provider" && <ProviderConsole r={r} show={show} openDossier={() => setDossier(true)} />}
          {tab === "settings" && <IntakeSettings r={r} />}
          {tab === "activity" && <Panel title="Activity log" right={<Chip>append-only</Chip>}><ActivityLog r={r} /></Panel>}
        </div>
      </div>
      {dossier && <Dossier close={() => setDossier(false)} />}
      <Toast toast={toast} />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><SpecialistApp /></StrictMode>);
