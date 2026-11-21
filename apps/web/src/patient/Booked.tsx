/**
 * Booked confirmation and the day-before check. The calendar file carries no health details: a neutral title,
 * the time and the neighborhood, and a pointer back to the app.
 */
import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { DEMO_TZ, MODE, PRODUCT_NAME, currentReferral, patientHome, type Patient, type Slot, type World } from "@attune/domain";
import { SIZE, T } from "../design/tokens";
import { clock, dayLong } from "../shared/format";
import { Button, Field, Ink, Notice, Overline, Paper, inputStyle, useAct, useToast } from "../shared/ui";
import { ME, PATIENT_ID, go } from "./nav";
import { Body, Screen, Small } from "./Screen";

const ics = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");

function downloadIcs(slot: Slot, place: string, now: string) {
  const end = new Date(Date.parse(slot.startsAt) + slot.minutes * 60_000).toISOString();
  const body = [
    "BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//${PRODUCT_NAME}//Demo//EN`, "BEGIN:VEVENT",
    `UID:${slot.id}@attune.example`, `DTSTAMP:${ics(now)}`, `DTSTART:${ics(slot.startsAt)}`, `DTEND:${ics(end)}`,
    `SUMMARY:Visit (${PRODUCT_NAME})`, `LOCATION:${slot.mode === "telehealth" ? "Telehealth" : place}`,
    `DESCRIPTION:Details are in ${PRODUCT_NAME}.`, "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "visit.ics";
  a.click();
  URL.revokeObjectURL(url);
}

export function Booked({ w, patient, now }: { w: World; patient: Patient; now: string }) {
  const [toast, show] = useToast();
  const run = useAct(show);
  const [changing, setChanging] = useState(false);
  const [update, setUpdate] = useState("");
  const referral = currentReferral(w, patient.id);
  const slot = referral?.slotId ? w.slots.find((s) => s.id === referral.slotId) : undefined;
  const practice = slot ? w.practices.find((p) => p.id === slot.practiceId) : undefined;

  if (!referral || !slot || !practice) {
    return (
      <Screen overline="Your visit" title="Nothing booked yet">
        <Paper seed={21}><Body>When you accept a time, it shows up here.</Body></Paper>
        <Button full onClick={() => go("/")}>Back to home</Button>
      </Screen>
    );
  }

  const h = patientHome(w, PATIENT_ID, now, DEMO_TZ);
  const confirm = (text: string) => {
    if (run({ ...ME, type: "confirmVisit", slotId: slot.id, update: text }, text ? "Sent. The office will see your note." : "Thanks. The office knows.")) setChanging(false);
  };
  const done = slot.status === "completed" || referral.status === "seen" || referral.status === "summary_received" || referral.status === "closed";

  return (
    <Screen bloom overline={done ? "Your visit" : "You're booked"} title={dayLong(slot.startsAt, practice.timeZone)} sub={`${clock(slot.startsAt, practice.timeZone)} · ${slot.minutes} minutes`}>
      <Paper seed={22}>
        <Body style={{ fontWeight: 600 }}>{slot.provider}</Body>
        <Body>{practice.name}</Body>
        <Body muted>{slot.mode === "telehealth" ? "Telehealth. The link comes from the office." : `${MODE[slot.mode]} · ${practice.place.label}`}</Body>
        {!done && (
          <div style={{ marginTop: 14 }}>
            <Button variant="secondary" full icon={<CalendarPlus size={18} aria-hidden />} onClick={() => downloadIcs(slot, practice.place.label, now)}>Add to calendar</Button>
            <Small style={{ marginTop: 6 }}>The calendar entry just says “Visit ({PRODUCT_NAME})”. No health details.</Small>
          </div>
        )}
        <Ink style={{ marginTop: 14 }}>{done ? "that's done." : "your story is already there."}</Ink>
      </Paper>

      {!done && slot.status === "confirmed" && (
        <Notice tone="done" title="You confirmed">
          {referral.patientUpdate ? `The office has your note: “${referral.patientUpdate}”` : "The office knows nothing has changed."}
        </Notice>
      )}

      {!done && h.booked?.canConfirm && (
        <Paper seed={23}>
          <Overline>The day before</Overline>
          <Body style={{ marginTop: 8, fontSize: SIZE.md }}>Has anything changed since you shared your Pack?</Body>
          {changing ? (
            <div className="flex flex-col gap-3" style={{ marginTop: 12 }}>
              <Field label="What changed?" htmlFor="update" hint="A sentence is plenty. It's added to your Pack for this office.">
                <textarea id="update" rows={3} value={update} onChange={(e) => setUpdate(e.target.value)} style={{ ...inputStyle, resize: "vertical" }} />
              </Field>
              <Button full onClick={() => confirm(update)} disabled={!update.trim()}>Send my update</Button>
              <Button full variant="quiet" onClick={() => setChanging(false)}>Cancel</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2" style={{ marginTop: 12 }}>
              <Button full onClick={() => confirm("")}>Nothing has changed</Button>
              <Button full variant="secondary" onClick={() => setChanging(true)}>Something changed</Button>
            </div>
          )}
        </Paper>
      )}

      {!done && slot.status === "filled" && !h.booked?.canConfirm && <Small>We'll ask you to confirm the day before.</Small>}

      <Paper seed={24} torn={false}>
        <Body>{practice.name} can see your Patient Pack.</Body>
        <div className="flex flex-wrap gap-x-5" style={{ marginTop: 6 }}>
          <a href="#/pack" style={{ minHeight: 44, display: "inline-flex", alignItems: "center", color: T.raspberry, fontSize: SIZE.body, textDecoration: "underline", textUnderlineOffset: 3 }}>See what they see</a>
          <a href="#/care" style={{ minHeight: 44, display: "inline-flex", alignItems: "center", color: T.raspberry, fontSize: SIZE.body, textDecoration: "underline", textUnderlineOffset: 3 }}>Change sharing</a>
        </div>
      </Paper>
      {toast}
    </Screen>
  );
}
