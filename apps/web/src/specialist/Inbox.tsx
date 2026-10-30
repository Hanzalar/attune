import { useState } from "react";
import { BellRing, CalendarHeart, Check, Clock, Database, FileCheck2, Hourglass, Plug, Send, ShieldCheck, UserCheck } from "lucide-react";
import { DEMO_PATIENT, DEMO_SHARE_ITEMS, DEMO_SLOT, DEMO_WAITLIST, reached, type Referral } from "@attune/domain";
import { EVIDENCE, StatusChip } from "../shared/Dossier";
import { useAct } from "../shared/loop";
import { C, MONO } from "../shared/theme";
import { Button, Chip, Label, Panel } from "../shared/ui";

const CHANNEL_LABEL = { efax: "e-fax", direct: "Direct (360X)", fhir: "FHIR" } as const;

export function Inbox({ r, show }: { r: Referral; show: (m: string, e?: boolean) => void }) {
  const run = useAct(show);
  const [note, setNote] = useState("");
  const arrived = reached(r, "sent") || r.stage === "declined";
  const inInbox = r.stage === "sent";
  const shared = new Set(DEMO_SHARE_ITEMS.filter((i) => r.share[i.key]).map((i) => i.source));

  if (r.stage === "withdrawn") {
    return <Panel title="Inbox"><p style={{ fontSize: 12.5, color: C.clinSlate }}>{DEMO_PATIENT.ref} was withdrawn by the patient. Records already delivered stay in your chart; nothing further is shared.</p></Panel>;
  }
  if (!arrived) {
    return (
      <Panel title="Inbox">
        <div className="flex items-center gap-3 rounded-lg p-4" style={{ background: C.clinChip }}>
          <Hourglass size={18} color={C.clinSlate} />
          <p style={{ fontSize: 12.5, color: C.clinSlate }}>{DEMO_PATIENT.ref} shows up here once the patient approves sharing and the PCP's office signs. Walk those steps in the patient app and PCP admin.</p>
        </div>
      </Panel>
    );
  }
  return (
    <Panel title={`${DEMO_PATIENT.ref} · from ${r.fromPractice}`} right={<Chip tone="blue"><Send size={11} /> Arrived by {r.channel ? CHANNEL_LABEL[r.channel] : "fax"} · also here</Chip>}>
      <div className="flex flex-wrap gap-1.5">
        <Chip tone="good"><ShieldCheck size={11} /> {r.plan} · in network</Chip>
        <Chip tone="good"><FileCheck2 size={11} /> {shared.size} sources attached</Chip>
        <Chip tone="good"><UserCheck size={11} /> PCP signed</Chip>
        {EVIDENCE.criteria.some((c) => c.status === "needs_labs") && <Chip tone="warn">1 lab gap</Chip>}
        {r.codes.map((c) => <Chip key={c}>{c}</Chip>)}
      </div>
      <Label mt={14}>Evidence, with where each item came from</Label>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full" style={{ fontSize: 12.5, borderCollapse: "collapse", minWidth: 460 }}>
          <tbody>
            {EVIDENCE.criteria.map((c) => (
              <tr key={c.id} style={{ borderBottom: `1px solid ${C.clinLine}`, opacity: shared.has(c.source) || c.status === "needs_labs" ? 1 : 0.45 }}>
                <td className="py-2 pr-3" style={{ color: C.clinInk, fontWeight: 600, verticalAlign: "top" }}>{c.label}</td>
                <td className="py-2 pr-3" style={{ color: C.clinSlate, verticalAlign: "top" }}>{shared.has(c.source) || c.status === "needs_labs" ? c.detail : "Not shared by the patient"}</td>
                <td className="py-2 pr-3" style={{ verticalAlign: "top" }}><Chip>{c.source}</Chip></td>
                <td className="py-2" style={{ verticalAlign: "top" }}><StatusChip status={c.status} /></td>
              </tr>
            ))}
            {EVIDENCE.supporting.map((s) => (
              <tr key={s} style={{ borderBottom: `1px solid ${C.clinLine}` }}>
                <td className="py-2 pr-3" style={{ color: C.clinInk, fontWeight: 600 }}>Metabolic</td>
                <td className="py-2 pr-3" style={{ color: C.clinSlate }}>{s}</td>
                <td className="py-2 pr-3"><Chip>LabCorp</Chip></td>
                <td className="py-2"><Chip tone="flag">Flag</Chip></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 mt-4 grid-cols-1 md:grid-cols-2">
        <div className="rounded-lg p-3" style={{ background: C.clinChip }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: C.clinInk }}>Her goals</div>
          <p style={{ fontSize: 12, color: C.clinSlate, marginTop: 4, lineHeight: 1.45 }}>{DEMO_PATIENT.goals}</p>
        </div>
        <div className="rounded-lg p-3" style={{ background: C.clinChip }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: C.clinInk }}>Questions she'll ask</div>
          <p style={{ fontSize: 12, color: C.clinSlate, marginTop: 4, lineHeight: 1.45 }}>{DEMO_PATIENT.questions}</p>
        </div>
      </div>
      {r.openRequests.length > 0 && (
        <p style={{ fontSize: 12, color: C.amberInk, background: C.amberSoft, borderRadius: 8, padding: "8px 10px", marginTop: 12 }}>
          Waiting on the patient's agent for: {r.openRequests.join("; ")}
        </p>
      )}
      {r.stage === "declined" ? (
        <p style={{ fontSize: 12.5, color: C.coralDeep, marginTop: 12 }}>You declined this referral: {r.note}</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mt-4 pt-4" style={{ borderTop: `1px solid ${C.clinLine}` }}>
            <Button kind="primary" color={C.coral} disabled={!inInbox} onClick={() => run({ type: "offerSlot", by: "specialist_staff", slot: DEMO_SLOT }, "Slot offered to the patient")}>
              <CalendarHeart size={15} /> {reached(r, "offered") ? `Accepted · ${r.offeredSlot?.label} offered` : `Accept and offer ${DEMO_SLOT.label}`}
            </Button>
            <Button disabled={!inInbox} onClick={() => run({ type: "requestRecords", by: "specialist_staff", note: note.trim() || "Most recent pelvic ultrasound images" }, "Request sent to the patient's agent")}>Request more records</Button>
            <Button disabled={!inInbox} onClick={() => run({ type: "declineReferral", by: "specialist_staff", note }, "Declined with a note to the PCP and patient")}>Decline with note</Button>
          </div>
          {inInbox && (
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for a records request or decline (required to decline)" aria-label="Note to the PCP and patient"
              className="w-full rounded-md px-3 py-2 mt-2" style={{ fontSize: 12.5, border: `1px solid ${C.clinLine}`, color: C.clinInk }} />
          )}
        </>
      )}
    </Panel>
  );
}

export function CancellationFill({ r, show }: { r: Referral; show: (m: string) => void }) {
  const [offered, setOffered] = useState(false);
  const queue = [DEMO_WAITLIST[0]!, { id: DEMO_PATIENT.ref, note: r.waitlist ? "Opted in · record ready" : "Not on waitlist" }, DEMO_WAITLIST[1]!];
  return (
    <Panel title="Cancellation fill" right={<Chip tone="warn">Slot open</Chip>}>
      <div className="rounded-lg p-3 flex items-center gap-3" style={{ background: C.amberSoft }}>
        <Clock size={18} color={C.amber} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.clinInk }}>Thu, Nov 5 · 9:20 AM</div>
          <div style={{ fontSize: 11.5, color: C.clinSlate }}>Cancelled 2 hours ago. New-patient slot, 40 min.</div>
        </div>
      </div>
      <Label mt={12}>Waitlist, matched and record-ready</Label>
      <ol className="flex flex-col gap-1.5 mt-1.5">
        {queue.map((q, i) => (
          <li key={q.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: C.clinChip, opacity: q.id === DEMO_PATIENT.ref && !r.waitlist ? 0.5 : 1 }}>
            <span className="flex items-center gap-2"><span className="tnum" style={{ fontSize: 11, color: C.clinSlate, width: 14 }}>{i + 1}</span><span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: C.clinInk }}>{q.id}</span></span>
            <span style={{ fontSize: 11.5, color: C.clinSlate }}>{q.note}</span>
          </li>
        ))}
      </ol>
      <button onClick={() => { setOffered(true); show(`Offered to ${queue[0]!.id} first, then the next in line`); }} className="w-full rounded-md py-2 mt-3 flex items-center justify-center gap-2"
        style={{ background: offered ? C.greenSoft : C.clinInk, color: offered ? C.green : "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
        {offered ? <><Check size={14} /> Offered · waiting on reply</> : <><BellRing size={14} /> Offer to next in line</>}
      </button>
      <p style={{ fontSize: 11, color: C.clinSlate, marginTop: 8 }}>Order is first-come by referral date. Paying for placement isn't an option. Unlike EHR-native waitlists, this reaches referred patients who aren't booked with you yet.</p>
    </Panel>
  );
}

export function WhereItLives() {
  return (
    <Panel title="Where this record lives">
      <div className="flex flex-col gap-2" style={{ fontSize: 12.5, color: C.clinInk }}>
        <div className="flex items-center gap-2"><Send size={14} color={C.blue} /> Today: e-fax lands in your EHR's fax inbox; Direct offices get a 360X package</div>
        <div className="flex items-center gap-2"><Plug size={14} color={C.clinSlate} /> Next: open it inside your EHR (SMART on FHIR app)</div>
        <div className="flex items-center gap-2"><Database size={14} color={C.clinSlate} /> Later: filed straight into the chart (vendor APIs)</div>
      </div>
    </Panel>
  );
}
