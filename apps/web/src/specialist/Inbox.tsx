import { useState } from "react";
import { BellRing, CalendarCheck, CalendarClock, Clock, Database, FileCheck2, Hourglass, Plug, Send, ShieldCheck, UserCheck } from "lucide-react";
import { DEMO_PATIENT, DEMO_SHARE_ITEMS, DEMO_SLOT, DEMO_SPECIALISTS, DEMO_WAITLIST, reached, type Referral } from "@attune/domain";
import { EVIDENCE, StatusChip } from "../shared/Dossier";
import { useAct } from "../shared/loop";
import { FONT, RADIUS, SIZE, T } from "../design/tokens";
import { Button, Chip, Label, Notice, Panel, StatusPill } from "../shared/ui";

const CHANNEL_LABEL = { efax: "e-fax", direct: "Direct (360X)", fhir: "FHIR" } as const;
const mono = { fontFamily: FONT.mono, fontVariantNumeric: "tabular-nums" } as const;
const body = { fontSize: SIZE.sm, color: T.text, lineHeight: 1.45 } as const;
const muted = { fontSize: SIZE.xs + 1, color: T.textMuted, lineHeight: 1.45 } as const;

function Outcome({ r }: { r: Referral }) {
  if (r.stage === "declined") return <div className="flex flex-wrap items-center gap-2"><StatusPill tone="danger">Declined</StatusPill><span style={body}>{r.note}</span></div>;
  if (r.stage === "offered") return <div className="flex flex-wrap items-center gap-2"><StatusPill tone="warning" icon={Clock}>Offered {r.offeredSlot?.label}</StatusPill><span style={muted}>Waiting on the patient to book.</span></div>;
  if (r.bookedSlot) return <div className="flex flex-wrap items-center gap-2"><StatusPill tone="success" icon={CalendarCheck}>Booked {r.bookedSlot.label}</StatusPill><span style={muted}>The patient and PCP can see it.</span></div>;
  return null;
}

export function Inbox({ r, show }: { r: Referral; show: (m: string, e?: boolean) => void }) {
  const run = useAct(show);
  const [note, setNote] = useState("");
  const arrived = reached(r, "sent") || r.stage === "declined";
  const inInbox = r.stage === "sent";
  const shared = new Set(DEMO_SHARE_ITEMS.filter((i) => r.share[i.key]).map((i) => i.source));
  const slots = DEMO_SPECIALISTS.find((s) => s.id === r.specialistId)?.openSlots ?? [];
  const firstOpen = slots[0] ?? DEMO_SLOT;
  const otherTime = slots.find((s) => s.at !== r.requestedSlot?.at) ?? DEMO_SLOT;

  if (r.stage === "withdrawn") {
    return <Panel title="Inbox"><Notice tone="warning" title={`${DEMO_PATIENT.ref} was withdrawn by the patient`}>Records already delivered stay in your chart. Nothing further is shared, and any held time is released.</Notice></Panel>;
  }
  if (!arrived) {
    return (
      <Panel title="Inbox">
        <div className="flex items-start gap-3 p-4" style={{ background: T.sunken, borderRadius: RADIUS.md }}>
          <Hourglass size={18} color={T.textMuted} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden />
          <p style={body}><span style={mono}>{DEMO_PATIENT.ref}</span> shows up here once the patient approves sharing and the PCP's office signs. Walk those steps in the patient app and PCP admin.</p>
        </div>
      </Panel>
    );
  }
  return (
    <Panel title={<span><span style={mono}>{DEMO_PATIENT.ref}</span> · from {r.fromPractice}</span>}
      right={<StatusPill tone="info" icon={Send}>Arrived by {r.channel ? CHANNEL_LABEL[r.channel] : "fax"}</StatusPill>}>
      <div className="flex flex-wrap gap-1.5">
        <StatusPill tone="success" icon={ShieldCheck}>{r.plan} · in network</StatusPill>
        <StatusPill tone="success" icon={FileCheck2}>{shared.size} sources attached</StatusPill>
        <StatusPill tone="success" icon={UserCheck}>PCP signed</StatusPill>
        {EVIDENCE.criteria.some((c) => c.status === "needs_labs") && <StatusPill tone="warning">1 lab gap</StatusPill>}
        {r.codes.map((c) => <span key={c} style={{ ...mono, fontSize: SIZE.xs + 1, background: T.sunken, borderRadius: RADIUS.sm, padding: "2px 6px" }}>{c}</span>)}
      </div>

      {r.requestedSlot && inInbox && (
        <div className="mt-4">
          <Notice tone="info" title={`Patient requested ${r.requestedSlot.label}`}>
            She picked this opening when she approved sharing. Confirming books it; no phone call needed.
          </Notice>
        </div>
      )}

      <Label mt={16}>Evidence, with where each item came from</Label>
      <div className="mt-2" style={{ overflowX: "auto" }}>
        <table className="w-full" style={{ ...body, borderCollapse: "collapse", minWidth: 520 }}>
          <tbody>
            {EVIDENCE.criteria.map((c) => {
              const visible = shared.has(c.source) || c.status === "needs_labs";
              return (
                <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td className="py-2 pr-3" style={{ fontWeight: 600, verticalAlign: "top" }}>{c.label}</td>
                  <td className="py-2 pr-3" style={{ color: visible ? T.textMuted : T.textSubtle, verticalAlign: "top", fontStyle: visible ? "normal" : "italic" }}>{visible ? c.detail : "Not shared by the patient"}</td>
                  <td className="py-2 pr-3" style={{ verticalAlign: "top" }}><Chip>{c.source}</Chip></td>
                  <td className="py-2" style={{ verticalAlign: "top" }}><StatusChip status={c.status} /></td>
                </tr>
              );
            })}
            {EVIDENCE.supporting.map((s) => (
              <tr key={s} style={{ borderBottom: `1px solid ${T.border}` }}>
                <td className="py-2 pr-3" style={{ fontWeight: 600 }}>Metabolic</td>
                <td className="py-2 pr-3" style={{ color: T.textMuted }}>{s}</td>
                <td className="py-2 pr-3"><Chip>LabCorp</Chip></td>
                <td className="py-2"><StatusPill tone="danger">Flag</StatusPill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 mt-4 grid-cols-1 md:grid-cols-2">
        {[["Her goals", DEMO_PATIENT.goals], ["Questions she'll ask", DEMO_PATIENT.questions]].map(([title, text]) => (
          <div key={title} className="p-3" style={{ background: T.sunken, borderRadius: RADIUS.md }}>
            <div style={{ ...body, fontWeight: 600 }}>{title}</div>
            <p className="mt-1" style={muted}>{text}</p>
          </div>
        ))}
      </div>
      {r.openRequests.length > 0 && <div className="mt-3"><Notice tone="warning" title="Waiting on the patient's agent">{r.openRequests.join("; ")}</Notice></div>}

      <div className="flex flex-col gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
        {inInbox ? (
          <>
            <div className="flex flex-wrap gap-2">
              {r.requestedSlot ? (
                <Button kind="primary" onClick={() => run({ type: "confirmRequestedSlot", by: "specialist_staff" }, "Visit booked. The patient and PCP can see it")}>
                  <CalendarCheck size={16} aria-hidden /> Confirm {r.requestedSlot.label}
                </Button>
              ) : (
                <Button kind="primary" onClick={() => run({ type: "offerSlot", by: "specialist_staff", slot: firstOpen }, "Slot offered to the patient")}>
                  <CalendarClock size={16} aria-hidden /> Accept and offer {firstOpen.label}
                </Button>
              )}
              {r.requestedSlot && (
                <Button onClick={() => run({ type: "offerSlot", by: "specialist_staff", slot: otherTime }, `Offered ${otherTime.label} instead`)}>Offer {otherTime.label} instead</Button>
              )}
              <Button onClick={() => run({ type: "requestRecords", by: "specialist_staff", note: note.trim() || "Most recent pelvic ultrasound images" }, "Request sent to the patient's agent")}>Request more records</Button>
              <Button kind="quiet" onClick={() => run({ type: "declineReferral", by: "specialist_staff", note }, "Declined with a note to the PCP and patient")}>Decline with note</Button>
            </div>
            <div>
              <label htmlFor="spec-note" style={{ ...muted, fontWeight: 600, display: "block" }}>Note to the PCP and patient (required to decline)</label>
              <input id="spec-note" value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 mt-1"
                style={{ ...body, minHeight: 36, border: `1px solid ${T.borderStrong}`, borderRadius: RADIUS.md, background: T.surface }} />
            </div>
          </>
        ) : <Outcome r={r} />}
      </div>
    </Panel>
  );
}

export function CancellationFill({ r, show }: { r: Referral; show: (m: string) => void }) {
  const [offered, setOffered] = useState(false);
  const queue = [DEMO_WAITLIST[0]!, { id: DEMO_PATIENT.ref, note: r.waitlist ? "Opted in · record ready" : "Not on waitlist" }, DEMO_WAITLIST[1]!];
  return (
    <Panel title="Cancellation fill" right={<StatusPill tone="warning" icon={Clock}>Slot open</StatusPill>}>
      <div className="p-3" style={{ border: `1px solid ${T.border}`, borderRadius: RADIUS.md }}>
        <div className="tnum" style={{ ...body, fontWeight: 600 }}>Thu, Nov 5 · 9:20 AM</div>
        <div style={muted}>Cancelled 2 hours ago. New-patient slot, 40 min.</div>
      </div>
      <Label mt={14}>Waitlist, matched and record-ready</Label>
      <ol className="flex flex-col mt-2">
        {queue.map((q, i) => {
          const out = q.id === DEMO_PATIENT.ref && !r.waitlist;
          return (
            <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 py-2" style={{ borderTop: i ? `1px solid ${T.border}` : "none", color: out ? T.textSubtle : T.text }}>
              <span className="flex items-center gap-2"><span className="tnum" style={{ ...muted, width: 14 }}>{i + 1}</span><span style={{ ...mono, fontSize: SIZE.sm, fontWeight: 500 }}>{q.id}</span></span>
              <span style={muted}>{q.note}</span>
            </li>
          );
        })}
      </ol>
      <div className="mt-3">
        {offered ? <StatusPill tone="success">Offered · waiting on reply</StatusPill> : (
          <Button kind="secondary" full onClick={() => { setOffered(true); show(`Offered to ${queue[0]!.id} first, then the next in line`); }}>
            <BellRing size={15} aria-hidden /> Offer to next in line
          </Button>
        )}
      </div>
      <p className="mt-3" style={muted}>Order is first-come by referral date. Paying for placement isn't an option. Unlike EHR-native waitlists, this reaches referred patients who aren't booked with you yet.</p>
    </Panel>
  );
}

export function WhereItLives() {
  const rows: [typeof Send, string, string][] = [
    [Send, "Today", "e-fax lands in your EHR's fax inbox; Direct offices get a 360X package"],
    [Plug, "Next", "open it inside your EHR (SMART on FHIR app)"],
    [Database, "Later", "filed straight into the chart (vendor APIs)"],
  ];
  return (
    <Panel title="Where this record lives">
      <ul className="flex flex-col gap-2.5">
        {rows.map(([Icon, when, what], i) => (
          <li key={when} className="flex items-start gap-2.5" style={body}>
            <Icon size={16} color={i === 0 ? T.brand : T.textMuted} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden />
            <span><b>{when}:</b> {what}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
