import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Inbox as InboxIcon, ShieldCheck, Stethoscope } from "lucide-react";
import { DEMO_EVIDENCE, DEMO_SPECIALISTS, draftCodes, toFhirBundle, type Referral } from "@attune/domain";
import "../index.css";
import { Dossier, EVIDENCE } from "../shared/Dossier";
import { ActivityLog, LoopBar } from "../shared/loop";
import { useReferral } from "../shared/store";
import { FONT, RADIUS, SIZE, T } from "../design/tokens";
import { Button, Chip, ClinHeader, Panel, StatusPill, Tabs, Toast, useToast } from "../shared/ui";
import { CancellationFill, Inbox, WhereItLives } from "./Inbox";
import { ProviderConsole } from "./Provider";

type Tab = "inbox" | "provider" | "settings" | "activity";

function IntakeSettings({ r }: { r: Referral }) {
  const s = DEMO_SPECIALISTS.find((x) => x.id === r.specialistId) ?? DEMO_SPECIALISTS[0]!;
  const displays = Object.fromEntries(draftCodes(EVIDENCE, DEMO_EVIDENCE, { acne: true }).map((c) => [c.code, c.display]));
  const rows: [string, string, boolean?][] = [
    ["Practice", s.practice], ["EHR", s.ehr],
    ["Fax", s.routes.fax ? `${s.routes.fax.number} · ${s.routes.fax.verified ? "verified" : "unverified"}` : "none", true],
    ["Direct (360X)", s.routes.direct ?? "none", true], ["FHIR inbox", s.routes.fhir ?? "v2: SMART on FHIR app"], ["NPI", s.npi, true],
  ];
  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1fr_1.2fr]">
      <div className="flex flex-col gap-4" style={{ minWidth: 0 }}>
        <Panel title="How you receive referrals" right={<Chip>read-only in the demo</Chip>}>
          <dl className="grid grid-cols-[minmax(0,120px)_minmax(0,1fr)] gap-x-3 gap-y-2" style={{ fontSize: SIZE.sm, color: T.text }}>
            {rows.map(([k, v, isId]) => (
              <div key={k} className="contents">
                <dt style={{ color: T.textMuted }}>{k}</dt>
                <dd style={{ fontFamily: isId ? FONT.mono : undefined, overflowWrap: "anywhere" }}>{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <WhereItLives />
      </div>
      <Panel title="This referral as FHIR (BSeR ServiceRequest + Task + Consent)" right={<Chip tone="blue">what a FHIR inbox receives</Chip>}>
        <pre style={{ fontFamily: FONT.mono, fontSize: SIZE.xs, color: T.text, background: T.sunken, borderRadius: RADIUS.md, padding: 12, maxHeight: 460, overflow: "auto" }}>
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
  const waiting = r.stage === "sent" ? 1 : 0;
  return (
    <div style={{ background: T.canvas, minHeight: "100vh", paddingLeft: "max(16px, env(safe-area-inset-left))", paddingRight: "max(16px, env(safe-area-inset-right))" }}>
      <LoopBar r={r} here="specialist" />
      <div className="mx-auto pb-10" style={{ maxWidth: 1180 }}>
        <ClinHeader icon={InboxIcon} title="New referrals" sub={`${practice} (example OB/GYN) · front desk and provider`}
          right={<>
            <StatusPill tone="success" icon={ShieldCheck}>Pre-qualified only</StatusPill>
            <Button onClick={() => setTab("provider")}><Stethoscope size={15} aria-hidden /> Provider console</Button>
          </>} />
        <div className="mt-2">
          <Tabs value={tab} onChange={setTab} tabs={[
            { id: "inbox", label: "Inbox", count: waiting }, { id: "provider", label: "Provider console" },
            { id: "settings", label: "Intake settings" }, { id: "activity", label: "Activity log", count: r.log.length },
          ]} />
        </div>
        <div className="mt-4">
          {tab === "inbox" && (
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1.4fr_1fr] items-start">
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
