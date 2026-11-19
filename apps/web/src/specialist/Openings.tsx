import { CheckCircle2, FileText, Undo2, Upload } from "lucide-react";
import { MODE, SLOT_STATUS, ms, referralForSlot, type Slot } from "@attune/domain";
import { RADIUS, SIZE, T } from "../design/tokens";
import { ago, when } from "../shared/format";
import { Button, Empty, Panel, StatusPill, formatLeft } from "../shared/ui";
import { PageTitle, go } from "../shared/Clinic";
import { PostForm } from "./PostForm";
import type { DeskProps } from "./types";

/** Openings: post a cancellation on the left, follow what Attune did with each one on the right. */
export function Openings(props: DeskProps) {
  const { w, practice } = props;
  const slots = w.slots.filter((s) => s.practiceId === practice.id).sort((a, b) => b.postedAt.localeCompare(a.postedAt));
  return (
    <>
      <PageTitle over="Openings" title="Fill a cancellation" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[400px_minmax(0,1fr)]">
        <PostForm key={practice.id} {...props} />
        <Panel title="Your openings" meta={`${slots.length} posted`}>
          {slots.length === 0 ? (
            <Empty>Nothing posted yet. When a patient cancels, post the time here and Attune offers it to a ready patient.</Empty>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }} className="flex flex-col gap-3">
              {slots.map((s) => <SlotRow key={s.id} slot={s} {...props} />)}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function SlotRow({ slot, w, now, practice, desk, run }: DeskProps & { slot: Slot }) {
  const meta = SLOT_STATUS[slot.status];
  const referral = referralForSlot(w, slot);
  const patient = referral ? w.patients.find((p) => p.id === referral.patientId) : undefined;
  const pending = w.offers.filter((o) => o.slotId === slot.id && o.status === "pending");
  const hold = pending.reduce<{ end: number; start: number } | null>((acc, o) => {
    const end = ms(o.expiresAt);
    return !acc || end > acc.end ? { end, start: ms(o.sentAt) } : acc;
  }, null);
  const attended = () => run({ ...desk, type: "markAttended", slotId: slot.id }, "Marked attended.");
  const withdraw = () => run({ ...desk, type: "withdrawSlot", slotId: slot.id }, "Opening withdrawn. Anyone holding it was told it's gone.");

  return (
    <li style={{ border: `1px solid ${T.hairline}`, borderRadius: RADIUS.sm, background: T.white, padding: "12px 14px" }}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p style={{ fontSize: SIZE.body, fontWeight: 600, margin: 0 }}>{when(slot.startsAt, practice.timeZone)}</p>
          <p style={{ fontSize: SIZE.sm, color: T.inkMuted, margin: "2px 0 0" }}>{slot.provider} · {slot.minutes} min · {MODE[slot.mode]} · posted {ago(slot.postedAt, now)}</p>
        </div>
        <StatusPill tone={meta.tone} label={meta.label} />
      </div>

      <div style={{ marginTop: 10, fontSize: SIZE.sm }}>
        {slot.status === "open" && <p style={{ margin: 0 }}>Matching now.</p>}

        {slot.status === "offering" && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div style={{ minWidth: 220, flex: 1 }}>
              <p style={{ margin: 0 }}><strong>Offering now · round {slot.rounds}.</strong> Who it went to stays private until someone accepts.</p>
              {hold && (
                <div style={{ marginTop: 6 }}>
                  <span className="tnum" style={{ fontWeight: 600 }}>{w.clock.pausedAt ? "Hold paused" : `Hold ends in ${formatLeft(hold.end - ms(now))}`}</span>
                  <div style={{ height: 4, background: T.hairline, borderRadius: 2, marginTop: 4, overflow: "hidden" }} aria-hidden>
                    <div style={{ height: "100%", width: `${Math.max(0, Math.min(1, (hold.end - ms(now)) / Math.max(1, hold.end - hold.start))) * 100}%`, background: T.raspberry }} />
                  </div>
                </div>
              )}
            </div>
            <Button size="sm" variant="secondary" icon={<Undo2 size={14} aria-hidden />} onClick={withdraw}>Withdraw</Button>
          </div>
        )}

        {(slot.status === "filled" || slot.status === "confirmed") && patient && referral && (
          <div className="flex flex-col gap-2">
            <p style={{ margin: 0 }}>
              <strong>{patient.name}</strong> accepted and shared her Patient Pack with you.{" "}
              {slot.status === "confirmed"
                ? referral.patientUpdate ? "She confirmed and noted a change." : "She confirmed nothing has changed."
                : "Not confirmed yet; she's asked the day before."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" icon={<FileText size={14} aria-hidden />} onClick={() => go(`pack/${referral.id}`)}>Open Patient Pack</Button>
              <Button size="sm" variant="secondary" icon={<CheckCircle2 size={14} aria-hidden />} onClick={attended}>Mark attended</Button>
              <Button size="sm" variant="quiet" onClick={() => go(`slot/${slot.id}`)}>Details</Button>
            </div>
          </div>
        )}

        {slot.status === "completed" && referral && (
          <div className="flex flex-wrap items-center gap-2">
            {referral.status === "seen" ? (
              <>
                <span>Attended. Send the summary so it reaches her record and her PCP.</span>
                <Button size="sm" icon={<Upload size={14} aria-hidden />} onClick={() => go(`slot/${slot.id}`)}>Upload visit summary</Button>
              </>
            ) : (
              <>
                <span>Attended. Summary sent.</span>
                <Button size="sm" variant="quiet" onClick={() => go(`slot/${slot.id}`)}>Details</Button>
              </>
            )}
          </div>
        )}

        {slot.status === "unfilled" && <p style={{ margin: 0 }}><strong>Why:</strong> {slot.unfilledReason}</p>}
        {slot.status === "withdrawn" && <p style={{ margin: 0, color: T.inkMuted }}>Withdrawn by your office.</p>}
      </div>
    </li>
  );
}
