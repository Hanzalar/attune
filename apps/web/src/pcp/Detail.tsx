import { useState, type ReactNode } from "react";
import { CalendarClock, Check, Clock, Download, FileCheck2, Send, ShieldCheck, UserCheck } from "lucide-react";
import {
  DEMO_EVIDENCE, DEMO_PATIENT, DEMO_PCP, DEMO_SHARE_ITEMS, DEMO_SPECIALISTS,
  draftCodes, reached, referralRequirement, type Referral, type Stage,
} from "@attune/domain";
import { EVIDENCE } from "../shared/Dossier";
import { useAct } from "../shared/loop";
import { FONT, RADIUS, SIZE, T } from "../design/tokens";
import { Button, Chip, Label, Panel, StatusPill, type StatusTone } from "../shared/ui";

export const CODES = draftCodes(EVIDENCE, DEMO_EVIDENCE, { acne: true });

/** Queue status for the Attune-drafted referral, as icon + word. */
export function queueStatus(r: Referral): [StatusTone, string] {
  switch (r.stage) {
    case "draft": return ["neutral", "Waiting on patient"];
    case "awaiting_pcp": return ["warning", "Ready to sign"];
    case "awaiting_physician": return ["warning", "Needs physician co-sign"];
    case "declined": return ["danger", "Declined by specialist"];
    case "withdrawn": return ["danger", "Withdrawn by patient"];
    default: return ["success", "Signed and sent"];
  }
}

function Step({ n, title, done, children }: { n: number; title: string; done: boolean; children: ReactNode }) {
  return (
    <section className="grid gap-x-3 grid-cols-[28px_minmax(0,1fr)] py-4" style={{ borderTop: `1px solid ${T.border}` }}>
      <span className="flex items-center justify-center tnum" aria-hidden
        style={{ width: 28, height: 28, borderRadius: RADIUS.md, background: done ? T.successSoft : T.brandSoft, color: done ? T.success : T.brandInk, fontSize: SIZE.sm, fontWeight: 600 }}>
        {done ? <Check size={15} /> : n}
      </span>
      <div style={{ minWidth: 0 }}>
        <h3 style={{ fontSize: SIZE.body - 1, fontWeight: 600, color: T.text, lineHeight: "28px" }}><span className="sr-only">Step {n}: </span>{title}</h3>
        <div className="mt-2">{children}</div>
      </div>
    </section>
  );
}

const mono = { fontFamily: FONT.mono, fontVariantNumeric: "tabular-nums" } as const;
const body = { fontSize: SIZE.sm, color: T.text, lineHeight: 1.45 } as const;
const muted = { fontSize: SIZE.xs + 1, color: T.textMuted, lineHeight: 1.45 } as const;

export function ReferralDetail({ r, show }: { r: Referral; show: (m: string, e?: boolean) => void }) {
  const run = useAct(show);
  const [codes, setCodes] = useState<string[]>(CODES.map((c) => c.code));
  const m = DEMO_SPECIALISTS.find((s) => s.id === r.specialistId);
  const req = referralRequirement(r.plan);
  const ma = DEMO_PCP.staff.find((s) => s.role === "pcp_ma")!;
  const doc = DEMO_PCP.staff.find((s) => s.role === "pcp_physician")!;
  const signer = r.stage === "awaiting_physician" ? doc : ma;
  const canSign = r.stage === "awaiting_pcp" || r.stage === "awaiting_physician";
  const signed = reached(r, "signed");
  const shared = DEMO_SHARE_ITEMS.filter((i) => r.share[i.key]);
  const [tone, status] = queueStatus(r);
  const ovul = EVIDENCE.criteria[0]!;
  const reviewed = signed || r.stage === "awaiting_physician";

  const signLabel = r.stage === "awaiting_physician" ? `Co-sign and send as ${doc.name}`
    : req.physicianSignature ? `Sign as ${ma.name} (physician co-signs next)` : "Sign and send";
  const signedMsg = r.stage === "awaiting_pcp" && req.physicianSignature ? "Signed. Sent to the physician for co-sign" : "Signed. Packet delivered with receipt";
  const why = r.stage === "draft" ? "Unlocks after the patient approves sharing in her app."
    : signed ? `Signed by ${[r.signatures.ma, r.signatures.physician].filter(Boolean).join(" and ")}.`
    : r.stage === "withdrawn" ? "The patient withdrew consent. Nothing further is shared." : null;

  return (
    <div className="flex flex-col gap-4" style={{ minWidth: 0 }}>
      <Panel title={<span><span style={mono}>{DEMO_PATIENT.ref}</span> · referral to {r.toSpecialty}</span>} right={<StatusPill tone={tone}>{status}</StatusPill>}>
        <Label>Reason, drafted by Attune</Label>
        <p className="mt-1" style={{ ...body, maxWidth: "75ch" }}>
          {DEMO_PATIENT.age} y. {ovul.detail} {EVIDENCE.criteria[1]!.detail} {EVIDENCE.supporting.join("; ")}. {EVIDENCE.gaps[0]} not yet on file. Patient asks for a PMOS workup and plan.
        </p>

        <div className="mt-4">
          <Step n={1} title="Confirm codes" done={reviewed}>
            <div className="flex flex-col gap-2">
              {CODES.map((c) => (
                <label key={c.code} className="flex items-start gap-2.5" style={{ ...body, cursor: canSign ? "pointer" : "default" }}>
                  <input type="checkbox" disabled={!canSign} checked={codes.includes(c.code)} style={{ marginTop: 3, width: 16, height: 16, accentColor: T.brand }}
                    onChange={() => setCodes(codes.includes(c.code) ? codes.filter((x) => x !== c.code) : [...codes, c.code])} />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ ...mono, fontWeight: 500, background: T.sunken, borderRadius: RADIUS.sm, padding: "1px 6px" }}>{c.code}</span> {c.display}
                    <span style={{ ...muted, display: "block" }}>{c.why}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2" style={muted}>Symptoms are coded, not a suspected diagnosis. E28.2 is drafted only when PMOS is already on the problem list.</p>
          </Step>

          <Step n={2} title="Check specialist and delivery route" done={reviewed}>
            {m && (
              <div className="p-3" style={{ border: `1px solid ${T.border}`, borderRadius: RADIUS.md }}>
                <div style={{ ...body, fontWeight: 600 }}>{m.name}</div>
                <div style={muted}>{m.practice} · runs {m.ehr} · patient's pick</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <StatusPill tone="success" icon={ShieldCheck}>In network</StatusPill>
                  {m.routes.fax?.verified && <StatusPill tone="success">Fax verified</StatusPill>}
                  {m.routes.direct && <StatusPill tone="success">Direct (360X)</StatusPill>}
                  <StatusPill tone="success">NPI matched</StatusPill>
                </div>
                <div className="mt-2" style={{ ...mono, fontSize: SIZE.xs + 1, color: T.textMuted }}>
                  {m.routes.direct ? `Direct ${m.routes.direct}` : `Fax ${m.routes.fax?.number}`} · NPI {m.npi}
                </div>
                {r.requestedSlot && (
                  <div className="flex items-center gap-2 mt-2" style={body}>
                    <CalendarClock size={16} color={T.brand} aria-hidden />
                    <span>Patient requested <b style={mono}>{r.requestedSlot.label}</b>, held until the office confirms</span>
                  </div>
                )}
              </div>
            )}
            <p className="mt-2" style={muted}>
              Plan {r.plan}: {req.referralRequired ? "referral required" : "referral not required"} · {req.physicianSignature ? "physician signature required" : "MA sign-off"} · verify the member's plan
            </p>
          </Step>

          <Step n={3} title="Review packet" done={reviewed}>
            <ul className="flex flex-col gap-1.5">
              {shared.map((i) => (
                <li key={i.key} className="flex flex-wrap items-center justify-between gap-2" style={body}>
                  <span className="flex items-center gap-1.5"><FileCheck2 size={15} color={T.success} aria-hidden /> {i.title}</span><Chip>{i.source}</Chip>
                </li>
              ))}
            </ul>
            <p className="mt-2" style={muted}>The patient approved exactly these items.</p>
          </Step>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
          <Button kind="primary" disabled={!canSign} onClick={() => run({ type: "signReferral", by: signer.role, codes, signer: signer.name }, signedMsg)}>
            {signed ? <><Check size={16} aria-hidden /> Signed and sent</> : <><UserCheck size={16} aria-hidden /> {signLabel}</>}
          </Button>
          <Button kind="quiet" onClick={() => window.print()}><Download size={15} aria-hidden /> PDF for your EMR</Button>
          {why && <span style={muted}>{why}</span>}
        </div>
      </Panel>

      <AfterSending r={r} />
    </div>
  );
}

const AFTER: [string, Stage][] = [["Delivered with receipt", "sent"], ["Received by the OB/GYN", "offered"], ["Visit booked", "booked"], ["Seen, notes back", "closed"]];

function AfterSending({ r }: { r: Referral }) {
  return (
    <Panel title="After sending" right={<span style={muted}>status from the specialist office</span>}>
      <ul className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {AFTER.map(([label, stage]) => {
          const done = reached(r, stage);
          return (
            <li key={label} className="p-3 flex flex-col gap-1.5" style={{ border: `1px solid ${T.border}`, borderRadius: RADIUS.md }}>
              {done ? <StatusPill tone="success">Done</StatusPill> : <StatusPill tone="neutral" icon={Clock}>Pending</StatusPill>}
              <span style={body}>{label}</span>
            </li>
          );
        })}
      </ul>
      {r.bookedSlot && <p className="mt-3 flex items-center gap-2" style={body}><Send size={15} color={T.brand} aria-hidden /> Booked for <b style={mono}>{r.bookedSlot.label}</b></p>}
      {r.stage === "declined" && <div className="mt-3"><StatusPill tone="danger">Declined</StatusPill> <span style={body}>{r.note}</span></div>}
      {r.outcome && <p className="mt-3" style={body}><b>Outcome:</b> {r.outcome}</p>}
    </Panel>
  );
}
