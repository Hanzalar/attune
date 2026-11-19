/**
 * Waitlist preferences: how far, telehealth or not, which days and times, and the shortest notice she can handle.
 * Offers only come for times that fit all of them. No promised dates, no queue position.
 */
import { useState } from "react";
import { DAY_PARTS, WEEKDAYS, currentReferral, type DayPart, type Patient, type WaitlistPrefs, type Weekday, type World } from "@attune/domain";
import { Button, Chip, Field, Overline, Paper, Toggle, inputStyle, useAct, useToast } from "../shared/ui";
import { daysWaiting } from "../shared/format";
import { ME, go } from "./nav";
import { Body, Screen, Small } from "./Screen";

const MILES = [5, 10, 15, 25, 50];
const NOTICE = [2, 4, 12, 24, 48];

export function Waitlist({ w, patient, now }: { w: World; patient: Patient; now: string }) {
  const [toast, show] = useToast();
  const run = useAct(show);
  const [p, setP] = useState<WaitlistPrefs>(patient.prefs);
  const referral = currentReferral(w, patient.id);
  const set = (patch: Partial<WaitlistPrefs>) => setP((prev) => ({ ...prev, ...patch }));
  const toggleDay = (d: Weekday) => set({ days: p.days.includes(d) ? p.days.filter((x) => x !== d) : [...p.days, d] });
  const togglePart = (t: DayPart) => set({ times: p.times.includes(t) ? p.times.filter((x) => x !== t) : [...p.times, t] });

  const save = () => {
    if (run({ ...ME, type: "setPrefs", patientId: patient.id, prefs: p }, p.paused ? "Paused. No offers until you turn it back on." : "Saved.")) go("/");
  };

  return (
    <Screen overline="Waitlist" title="What works for you" sub="We only hold times that fit all of this. We never promise a date or a place in line.">
      {referral?.waitlistSince && (referral.status === "on_waitlist" || referral.status === "offered") && (
        <Body muted>On the list for {daysWaiting(referral.waitlistSince, now)}.</Body>
      )}
      <Paper seed={81} torn={false}>
        <div className="flex flex-col gap-5">
          <Field label="How far you'll travel" htmlFor="miles">
            <select id="miles" value={p.maxMiles} onChange={(e) => set({ maxMiles: Number(e.target.value) })} style={inputStyle}>
              {MILES.map((m) => <option key={m} value={m}>Up to {m} miles</option>)}
            </select>
          </Field>
          <Toggle id="telehealth" on={p.telehealth} onChange={(on) => set({ telehealth: on })} label="Telehealth is fine" detail="Video visits skip the distance limit." />
          <div>
            <Overline>Days</Overline>
            <div className="flex flex-wrap gap-2" style={{ marginTop: 8 }} role="group" aria-label="Days that work">
              {WEEKDAYS.map((d) => <Chip key={d.day} selected={p.days.includes(d.day)} onClick={() => toggleDay(d.day)}>{d.short}</Chip>)}
            </div>
          </div>
          <div>
            <Overline>Times</Overline>
            <div className="flex flex-wrap gap-2" style={{ marginTop: 8 }} role="group" aria-label="Times that work">
              {DAY_PARTS.map((t) => <Chip key={t.part} selected={p.times.includes(t.part)} onClick={() => togglePart(t.part)}>{t.label}</Chip>)}
            </div>
            <Small style={{ marginTop: 6 }}>{DAY_PARTS.map((t) => `${t.label.toLowerCase()} ${t.hours}`).join(" · ")}</Small>
          </div>
          <Field label="Shortest notice you can handle" htmlFor="notice" hint="We won't offer a time that starts sooner than this.">
            <select id="notice" value={p.minNoticeHours} onChange={(e) => set({ minNoticeHours: Number(e.target.value) })} style={inputStyle}>
              {NOTICE.map((h) => <option key={h} value={h}>{h} hours</option>)}
            </select>
          </Field>
          <Toggle id="paused" on={p.paused} onChange={(on) => set({ paused: on })} label="Pause offers" detail="You stay on the list; we just won't hold times for you until you turn this off." />
        </div>
      </Paper>
      <Button full onClick={save}>Save preferences</Button>
      {toast}
    </Screen>
  );
}
