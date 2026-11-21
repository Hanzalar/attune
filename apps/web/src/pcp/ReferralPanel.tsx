import type { ReactNode } from "react";
import { FilePlus2 } from "lucide-react";
import { REFERRAL_STATUS, SPECIALTY, demoChart, type Patient, type Referral, type Specialty, type World } from "@attune/domain";
import { SIZE, T } from "../design/tokens";
import { dateShort, daysWaiting, when } from "../shared/format";
import { Button, Notice, Panel, Rows, StatusPill } from "../shared/ui";
import { AttachButtons } from "./Attach";
import { Builder } from "./Builder";
import { attachable, missingResultNames, nextStep } from "./next";
import type { Actor, Run } from "./types";

/** The right-hand referral column: start one, build and sign the draft, or follow it once sent. */
export function ReferralPanel({ w, now, patient, referral, actor, run, onSignAs }: {
  w: World; now: string; patient: Patient; referral: Referral | null; actor: Actor; run: Run; onSignAs: () => void;
}) {
  if (referral && referral.status === "draft") {
    return <Builder w={w} now={now} patient={patient} referral={referral} actor={actor} run={run} onSignAs={onSignAs} />;
  }
  if (referral && referral.status !== "closed") return <Status w={w} now={now} patient={patient} referral={referral} actor={actor} run={run} />;

  const start = (specialty: Specialty) =>
    run({ ...actor, type: "startReferral", patientId: patient.id, pcpId: patient.pcpId, specialty }, `Draft ${SPECIALTY[specialty].label.toLowerCase()} referral started.`);
  return (
    <Panel title="Refer her" meta="No fax, no hunting for a specialist">
      {referral && <p style={{ fontSize: SIZE.sm, color: T.inkMuted, margin: "0 0 10px" }}>Her last referral ({SPECIALTY[referral.specialty].label}) is closed.</p>}
      <p style={{ fontSize: SIZE.sm, margin: "0 0 12px" }}>Pick the specialty. Attune checks the referral against each practice's criteria and her insurance, then fills her into cancellations.</p>
      <div className="flex flex-wrap gap-2">
        {(["gyno", "endo"] as const).map((s) => (
          <Button key={s} size="md" variant="secondary" icon={<FilePlus2 size={16} aria-hidden />} onClick={() => start(s)}>
            {SPECIALTY[s].label}
          </Button>
        ))}
      </div>
    </Panel>
  );
}

function Status({ w, now, patient, referral: r, actor, run }: { w: World; now: string; patient: Patient; referral: Referral; actor: Actor; run: Run }) {
  const meta = REFERRAL_STATUS[r.status];
  const slot = r.slotId ? w.slots.find((s) => s.id === r.slotId) : undefined;
  const practice = slot ? w.practices.find((p) => p.id === slot.practiceId) : undefined;
  const fax = r.faxPracticeId ? w.practices.find((p) => p.id === r.faxPracticeId) : undefined;
  const next = nextStep(r, patient);
  const missingNames = missingResultNames(r, demoChart(patient.id, now));

  const rows: [string, ReactNode][] = [
    ["Specialty", SPECIALTY[r.specialty].label],
    ["Signed", r.signature ? `${r.signature.signer}, ${dateShort(r.signature.at)}` : "—"],
    ["Urgent", r.urgent ? "Yes: offered openings first" : "No"],
    ["Next", `${next.step} · ${next.owner}`],
  ];
  if (r.waitlistSince) rows.push(["On the waitlist", daysWaiting(r.waitlistSince, now)]);
  if (slot && practice) rows.push(["Visit", `${when(slot.startsAt, practice.timeZone)} · ${slot.provider} · ${practice.name}`]);
  if (fax) rows.push(["Sent to", `${fax.name} (not on Attune)`]);

  return (
    <Panel title="Referral" actions={<StatusPill tone={r.route === "fax" ? "neutral" : meta.tone} label={r.route === "fax" ? "Prepared for fax" : meta.label} />}>
      <div className="flex flex-col gap-3">
        <Rows rows={rows} />
        <p style={{ fontSize: SIZE.sm, margin: 0, color: T.inkMuted }}>“{r.reason}”</p>
        {r.status === "needs_info" && (
          <Notice tone="attention" title="Missing for every practice in this specialty">
            <ul style={{ margin: "2px 0 8px", paddingLeft: 18 }}>{r.missing.map((m) => <li key={m}>{m}</li>)}</ul>
            <AttachButtons results={attachable(patient, missingNames, now)} referral={r} patient={patient} actor={actor} run={run} />
          </Notice>
        )}
        {r.status === "insurance_issue" && <Notice tone="issue">Her insurance check found a problem. She has been asked to fix it in her app.</Notice>}
        {r.route === "fax" && <Notice tone="attention">Prepared for the fax fallback. Not transmitted in the prototype.</Notice>}
      </div>
    </Panel>
  );
}
