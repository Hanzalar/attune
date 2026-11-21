/**
 * The daily check-in: four scales, about a minute. After saving she gets an acknowledgement in her ink, never advice
 * or an interpretation of what she logged.
 */
import { useState } from "react";
import { CHECKIN_SCALES, DEMO_TZ, canSee, nameOf, recipientsOf, streak, todayIn, type Patient, type Score, type World } from "@attune/domain";
import { SIZE } from "../design/tokens";
import { Button, Dots, Ink, Paper, useAct, useToast } from "../shared/ui";
import { ME, go } from "./nav";
import { Body, Screen, Small } from "./Screen";

type Key = keyof typeof CHECKIN_SCALES;
const KEYS = Object.keys(CHECKIN_SCALES) as Key[];

const isScore = (n: number | null): n is Score => n !== null && n >= 1 && n <= 5;

export function CheckIn({ w, patient, now }: { w: World; patient: Patient; now: string }) {
  const [toast, show] = useToast();
  const run = useAct(show);
  const today = todayIn(now, DEMO_TZ);
  const existing = patient.checkIns.find((c) => c.date === today);
  const [values, setValues] = useState<Record<Key, number | null>>({
    mood: existing?.mood ?? null, sleep: existing?.sleep ?? null, energy: existing?.energy ?? null, skin: existing?.skin ?? null,
  });
  const [saved, setSaved] = useState(false);
  const sharedWith = recipientsOf(w, patient.id).filter((r) => canSee(w, patient.id, r, "trends")).map((r) => nameOf(w, r));
  const complete = KEYS.every((k) => isScore(values[k]));

  const save = () => {
    const { mood, sleep, energy, skin } = values;
    if (!isScore(mood) || !isScore(sleep) || !isScore(energy) || !isScore(skin)) return;
    if (run({ ...ME, type: "logCheckIn", patientId: patient.id, checkIn: { date: today, mood, sleep, energy, skin } })) setSaved(true);
  };

  if (saved) {
    const n = streak(patient.checkIns, today);
    return (
      <Screen overline="Check-in" title="Noted.">
        <Paper seed={31}>
          <Ink style={{ fontSize: SIZE.xl }}>{n > 1 ? `${n} days in a row.` : "first one, noted."}</Ink>
          <Body style={{ marginTop: 10 }}>It's in your record. {sharedWith.length ? `Shared as trends with ${sharedWith.join(" and ")}.` : "Private to you."}</Body>
        </Paper>
        <Button full onClick={() => go("/")}>Done</Button>
        {toast}
      </Screen>
    );
  }

  return (
    <Screen overline="Check-in · about a minute" title={<>How are you,<br />really?</>}>
      <Paper seed={32} torn={false}>
        {KEYS.map((k) => (
          <Dots
            key={k}
            label={CHECKIN_SCALES[k].label}
            low={CHECKIN_SCALES[k].low}
            high={CHECKIN_SCALES[k].high}
            value={values[k]}
            onChange={(v) => setValues((prev) => ({ ...prev, [k]: v }))}
          />
        ))}
        <Small style={{ marginTop: 10 }}>
          {sharedWith.length ? `Your trends are shared with ${sharedWith.join(" and ")}. Change that in Care team.` : "Private to you unless you share it."}
        </Small>
      </Paper>
      <Button full onClick={save} disabled={!complete}>{existing ? "Update today's check-in" : "Done"}</Button>
      {!complete && <Small style={{ textAlign: "center" }}>Answer all four to save.</Small>}
      {toast}
    </Screen>
  );
}
