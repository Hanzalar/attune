import { useState } from "react";
import { ArrowLeft, CheckCircle2, FileText, Upload } from "lucide-react";
import { MODE, SLOT_STATUS, referralForSlot } from "@attune/domain";
import { SIZE, T } from "../design/tokens";
import { when } from "../shared/format";
import { Button, Field, Notice, Panel, Rows, StatusPill, inputStyle } from "../shared/ui";
import { CheckRow, PageTitle, go } from "../shared/Clinic";
import type { DeskProps } from "./types";

/** One opening in full, with the visit summary form once the visit is attended. */
export function SlotDetail({ w, now, practice, desk, run, slotId }: DeskProps & { slotId: string }) {
  const slot = w.slots.find((s) => s.id === slotId && s.practiceId === practice.id);
  const [text, setText] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [backToPcp, setBackToPcp] = useState(true);

  const back = (
    <a href="#/openings" className="inline-flex items-center gap-1" style={{ color: T.raspberry, fontWeight: 600, fontSize: SIZE.sm, marginTop: 16, minHeight: 32 }}>
      <ArrowLeft size={14} aria-hidden /> All openings
    </a>
  );
  if (!slot) return <>{back}<div style={{ marginTop: 12 }}><Notice tone="issue">That opening isn't one of {practice.name}'s.</Notice></div></>;

  const referral = referralForSlot(w, slot);
  const patient = referral ? w.patients.find((p) => p.id === referral.patientId) : undefined;
  const summary = referral?.summaryId ? w.summaries.find((s) => s.id === referral.summaryId) : undefined;
  const pcp = referral ? w.practices.find((p) => p.id === referral.pcpId) : undefined;
  const meta = SLOT_STATUS[slot.status];

  const upload = () => {
    const ok = run({ by: "specialist_provider", who: slot.provider, type: "uploadSummary", slotId: slot.id, text, followUp, backToPcp }, `Summary sent to her record${pcp ? ` and ${pcp.name}` : ""}.`);
    if (ok) {
      setText("");
      setFollowUp("");
    }
  };

  return (
    <>
      {back}
      <PageTitle over={`Opening ${slot.id}`} title={when(slot.startsAt, practice.timeZone)}>
        <StatusPill tone={meta.tone} label={meta.label} />
      </PageTitle>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Visit">
          <Rows
            rows={[
              ["Provider", slot.provider],
              ["Length", `${slot.minutes} minutes`],
              ["Type", MODE[slot.mode]],
              ["Posted", `${when(slot.postedAt, practice.timeZone)} by ${slot.postedBy}`],
              ["Patient", patient ? `${patient.name} · ${patient.ref}` : "Nobody yet. You see her once she accepts."],
              ["Referred by", pcp?.name ?? "—"],
              ["Day-before check", slot.status === "confirmed" ? (referral?.patientUpdate ? `Changed: ${referral.patientUpdate}` : "Nothing has changed") : "Not confirmed"],
            ]}
          />
          {slot.status === "unfilled" && <div style={{ marginTop: 12 }}><Notice tone="issue" title="Closed unfilled">{slot.unfilledReason}</Notice></div>}
          {referral && (slot.status === "filled" || slot.status === "confirmed") && (
            <div className="flex flex-wrap gap-2" style={{ marginTop: 12 }}>
              <Button size="sm" icon={<FileText size={14} aria-hidden />} onClick={() => go(`pack/${referral.id}`)}>Open Patient Pack</Button>
              <Button size="sm" variant="secondary" icon={<CheckCircle2 size={14} aria-hidden />} onClick={() => run({ ...desk, type: "markAttended", slotId: slot.id }, "Marked attended.")}>Mark attended</Button>
            </div>
          )}
        </Panel>

        <Panel title="Visit summary" meta="Goes to her record and, if she shares summaries with them, her PCP">
          {summary ? (
            <div style={{ fontSize: SIZE.sm }}>
              <p style={{ margin: 0, color: T.inkMuted }}>Sent {when(summary.at, practice.timeZone)} by {summary.author}</p>
              <p style={{ margin: "8px 0 0", fontSize: SIZE.body, lineHeight: 1.5 }}>{summary.text}</p>
              {summary.followUp && <p style={{ margin: "8px 0 0" }}><strong>Follow-up:</strong> {summary.followUp}</p>}
              <p style={{ margin: "8px 0 0" }}>{summary.backToPcp ? "Returned to the PCP for ongoing care." : "Continuing care here."}</p>
            </div>
          ) : slot.status === "completed" && referral?.status === "seen" ? (
            <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); upload(); }}>
              <Field label="Summary" htmlFor="summary" hint="What you found and agreed with her, in plain words. She reads this too.">
                <textarea id="summary" rows={6} value={text} onChange={(e) => setText(e.target.value)} style={{ ...inputStyle, minHeight: 140, resize: "vertical", fontSize: SIZE.sm }} />
              </Field>
              <Field label="Follow-up" htmlFor="followup">
                <input id="followup" value={followUp} onChange={(e) => setFollowUp(e.target.value)} placeholder="e.g. Recheck in 8 weeks" style={{ ...inputStyle, fontSize: SIZE.sm }} />
              </Field>
              <CheckRow id="back" checked={backToPcp} onChange={setBackToPcp} label="Returned to PCP for ongoing care" />
              <Button type="submit" size="md" icon={<Upload size={16} aria-hidden />}>Send summary as {slot.provider}</Button>
            </form>
          ) : (
            <p style={{ fontSize: SIZE.sm, color: T.inkMuted, margin: 0 }}>
              {slot.status === "filled" || slot.status === "confirmed" ? `Mark the visit attended after it starts (${when(slot.startsAt, practice.timeZone)}); the form opens then.` : "No visit to summarize."}
            </p>
          )}
          <p style={{ fontSize: SIZE.xs, color: T.inkMuted, margin: "12px 0 0" }}>Clock: {when(now, practice.timeZone)}</p>
        </Panel>
      </div>
    </>
  );
}
