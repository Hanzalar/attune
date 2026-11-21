import { DEMO_IDS, DEMO_PEOPLE, demoWorld, run, type Command, type World } from "../src";

/** Wednesday 4 PM in Dallas. Thursday 2:40 PM is ~22.7 h out (4–24 h band); Friday 2:40 PM is ~46.7 h (24–48 h). */
export const NOW = "2026-11-18T22:00:00.000Z";
export const THU_AFTERNOON = "2026-11-19T20:40:00.000Z";
export const FRI_AFTERNOON = "2026-11-20T20:40:00.000Z";
export const SAT_MORNING = "2026-11-21T16:00:00.000Z";

export const later = (iso: string, minutes: number) => new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();

export const who = {
  patient: { by: "patient" as const, who: DEMO_PEOPLE.patient },
  ma: { by: "pcp_ma" as const, who: DEMO_PEOPLE.ma },
  doc: { by: "pcp_physician" as const, who: DEMO_PEOPLE.physician },
  desk: { by: "specialist_staff" as const, who: DEMO_PEOPLE.frontDesk },
  ops: { by: "ops" as const, who: DEMO_PEOPLE.ops },
};

export function fill(): World {
  return demoWorld(NOW, "fill");
}

export function post(w: World, startsAt: string, at = NOW, extra: Partial<Extract<Command, { type: "postCancellation" }>> = {}): World {
  return run(w, { ...who.desk, type: "postCancellation", practiceId: DEMO_IDS.endo, provider: DEMO_PEOPLE.endo, startsAt, minutes: 40, mode: "in_person", ...extra }, at);
}

export const pendingFor = (w: World, patientId: string) => w.offers.filter((o) => o.patientId === patientId && o.status === "pending");
export const ari = DEMO_IDS.patient;
