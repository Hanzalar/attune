import { useState } from "react";
import { CalendarPlus, EyeOff } from "lucide-react";
import { MODE, addMs, holdMs, holdRule, hoursUntil, localParts, ms, zonedToIso, type VisitMode } from "@attune/domain";
import { RADIUS, SIZE, T } from "../design/tokens";
import { Button, Chip, Field, Notice, Panel, inputStyle } from "../shared/ui";
import type { DeskProps } from "./types";

const DAY = 86_400_000;
const LENGTHS = [20, 30, 40, 60];

const dayLabel = (date: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" }).format(new Date(`${date}T12:00:00Z`));

function leadText(hours: number): string {
  return hours < 1 ? `${Math.max(1, Math.round(hours * 60))} min` : `${Math.round(hours)} h`;
}

function holdText(msHold: number): string {
  const s = Math.round(msHold / 1000);
  return s < 120 ? `${s} s` : `${Math.round(s / 60)} min`;
}

/** The next weekday whose 2:40 PM is at least 14 hours away: "tomorrow afternoon" in the demo. */
function defaultDay(now: string, tz: string): string {
  for (let i = 0; i < 10; i++) {
    const d = localParts(addMs(now, i * DAY), tz);
    if (d.weekday >= 1 && d.weekday <= 5 && ms(zonedToIso(d.date, "14:40", tz)) - ms(now) >= 14 * 3_600_000) return d.date;
  }
  return localParts(addMs(now, DAY), tz).date;
}

/** Post a cancellation. The front desk picks the time; Attune picks who is offered it, by rules the desk can't see into. */
export function PostForm({ w, now, practice, desk, run }: DeskProps) {
  const tz = practice.timeZone;
  const days = [...new Set(Array.from({ length: 8 }, (_, i) => localParts(addMs(now, i * DAY), tz).date))];
  const [provider, setProvider] = useState(practice.providers[0] ?? "");
  const [date, setDate] = useState(() => defaultDay(now, tz));
  const [time, setTime] = useState("14:40");
  const [minutes, setMinutes] = useState(40);
  const [mode, setMode] = useState<VisitMode>("in_person");

  const startsAt = date && time ? zonedToIso(date, time, tz) : null;
  const lead = startsAt ? hoursUntil(now, startsAt) : 0;
  const rule = startsAt && lead > 0 ? holdRule(startsAt, now) : null;
  const hold = startsAt && lead > 0 ? holdMs(startsAt, now, w.clock.speed) : 0;

  const post = () => {
    if (!startsAt) return;
    run({ ...desk, type: "postCancellation", practiceId: practice.id, provider, startsAt, minutes, mode }, "Posted. Its status below shows what Attune did with it.");
  };

  return (
    <Panel title="Post a cancellation" meta={`Times in ${tz.replace("_", " ")}`}>
      <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); post(); }}>
        <Field label="Provider" htmlFor="provider">
          <select id="provider" value={provider} onChange={(e) => setProvider(e.target.value)} style={{ ...inputStyle, fontSize: SIZE.sm }}>
            {practice.providers.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Day" htmlFor="day">
            <select id="day" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, fontSize: SIZE.sm }}>
              {days.map((d) => <option key={d} value={d}>{dayLabel(d)}</option>)}
            </select>
          </Field>
          <Field label="Start time" htmlFor="time">
            <input id="time" type="time" min="08:00" max="17:55" step={300} value={time} onChange={(e) => setTime(e.target.value)} style={{ ...inputStyle, fontSize: SIZE.sm }} />
          </Field>
        </div>
        <Field label="Length" htmlFor="length">
          <select id="length" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} style={{ ...inputStyle, fontSize: SIZE.sm }}>
            {LENGTHS.map((m) => <option key={m} value={m}>{m} minutes</option>)}
          </select>
        </Field>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontSize: SIZE.sm, fontWeight: 600, marginBottom: 6 }}>Visit type</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MODE) as VisitMode[]).map((m) => <Chip key={m} selected={mode === m} onClick={() => setMode(m)}>{MODE[m]}</Chip>)}
          </div>
        </fieldset>

        <div aria-live="polite" style={{ fontSize: SIZE.sm, background: T.bone, borderRadius: RADIUS.sm, padding: "8px 10px" }}>
          {rule ? (
            <>
              <strong>Starts in {leadText(lead)}</strong> · {rule.label}: {rule.holdMinutes}-minute hold, up to {rule.batch} {rule.batch === 1 ? "patient" : "patients"} at once
              {w.clock.speed > 1 && ` (demo speed ${w.clock.speed}×: ${holdText(hold)} each)`}.
              {w.clock.pausedAt && " Timers are paused in the demo."}
            </>
          ) : (
            "Pick a time in the future."
          )}
        </div>
        <Button type="submit" size="md" icon={<CalendarPlus size={16} aria-hidden />} disabled={!rule || !provider}>Post opening</Button>
        <Notice title="You can't see the waitlist or pick patients">
          <span className="inline-flex items-start gap-1.5"><EyeOff size={14} aria-hidden style={{ marginTop: 2, flexShrink: 0 }} />Your only lever is the criteria you publish. You see who took the slot once she accepts, which is her consent to share her Pack with you.</span>
        </Notice>
      </form>
    </Panel>
  );
}
