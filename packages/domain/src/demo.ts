/**
 * Synthetic demo world. Every person, practice and plan is invented and labelled (example); the public repo holds no
 * PHI. Ari's history is built by running real commands at past times, so the seed obeys the same rules as the demo.
 * Dates are relative to `now`, so results never age out of the criteria windows.
 */
import { ATTESTATION, DEFAULT_DEMO_SPEED } from "./config";
import { run, type Command } from "./commands";
import { checkAcrossSpecialty } from "./criteria";
import { addMs, localParts } from "./time";
import type { CheckIn, Consent, Patient, Plan, Practice, Referral, Result, Score, Specialty, WaitlistPrefs, World } from "./types";

export const DEMO_TZ = "America/Chicago";
export const DEMO_IDS = { patient: "p-ari", pcp: "cedar", endo: "bluebonnet-endo", gyno: "ndwc-gyno" } as const;
export const DEMO_PEOPLE = {
  patient: "Ari (example)",
  ma: "Alex R. (example)",
  physician: "Dr. Sam Patel (example)",
  frontDesk: "Jordan M. (example)",
  endo: "Dr. Ana Rivera (example)",
  ops: "Attune ops (demo)",
} as const;

const DAY = 86_400_000;
const HOUR = 3_600_000;
const ago = (now: string, days: number, hours = 0) => addMs(now, -(days * DAY + hours * HOUR));
const dateOf = (iso: string) => localParts(iso, DEMO_TZ).date;

export const DEMO_PLANS: Plan[] = [
  { id: "lonestar-ppo", carrier: "Lone Star Health (example)", name: "Choice PPO", type: "PPO" },
  { id: "prairie-epo", carrier: "Prairie Mutual (example)", name: "Open Access EPO", type: "EPO" },
  { id: "pecan-pos", carrier: "Pecan Health (example)", name: "Select POS", type: "POS" },
  { id: "gulf-hmo", carrier: "Gulf Coast Care (example)", name: "Local HMO", type: "HMO" },
];
const ALL_PLANS = DEMO_PLANS.map((p) => p.id);

const pcp = (id: string, name: string, lat: number, lng: number, staff: Practice["staff"]): Practice => ({
  id, name, kind: "pcp", specialty: null, onAttune: true, place: { label: "Dallas, TX", lat, lng }, timeZone: DEMO_TZ,
  plans: ALL_PLANS, criteria: [], providers: [], staff, routes: { fax: { number: "(214) 555-0140", verified: true } },
});

const specialist = (p: Omit<Practice, "kind" | "timeZone" | "staff"> & { staff?: Practice["staff"] }): Practice => ({
  kind: "specialist", timeZone: DEMO_TZ, staff: p.staff ?? [{ name: "Front desk (example)", role: "specialist_staff" }], ...p,
});

export const DEMO_PRACTICES: Practice[] = [
  pcp("cedar", "Cedar Family Medicine (example)", 32.83, -96.77, [
    { name: DEMO_PEOPLE.ma, role: "pcp_ma" },
    { name: DEMO_PEOPLE.physician, role: "pcp_physician" },
  ]),
  pcp("oaklawn", "Oak Lawn Primary Care (example)", 32.81, -96.81, [{ name: "Front office (example)", role: "pcp_ma" }]),
  specialist({
    id: "bluebonnet-endo", name: "Bluebonnet Endocrinology (example)", specialty: "endo", onAttune: true,
    place: { label: "Medical District, Dallas", lat: 32.812, lng: -96.838 }, plans: ["lonestar-ppo", "prairie-epo", "pecan-pos"],
    criteria: [{ kind: "result", name: "A1c", withinMonths: 12 }, { kind: "result", name: "TSH", withinMonths: 12 }],
    providers: [DEMO_PEOPLE.endo, "Dr. Lee Tran (example)"],
    staff: [{ name: DEMO_PEOPLE.frontDesk, role: "specialist_staff" }, { name: DEMO_PEOPLE.endo, role: "specialist_provider" }],
    routes: { direct: "intake@direct.bluebonnet-endo.example" },
  }),
  specialist({
    id: "trinity-endo", name: "Trinity Endocrine Associates (example)", specialty: "endo", onAttune: true,
    place: { label: "Fort Worth", lat: 32.74, lng: -97.34 }, plans: ["lonestar-ppo", "gulf-hmo"],
    criteria: [{ kind: "result", name: "A1c", withinMonths: 6 }, { kind: "result", name: "Total testosterone", withinMonths: 12 }],
    providers: ["Dr. Omar Haddad (example)"], routes: { fax: { number: "(817) 555-0121", verified: true } },
  }),
  specialist({
    id: "ndwc-gyno", name: "North Dallas Women's Care (example)", specialty: "gyno", onAttune: true,
    place: { label: "North Dallas", lat: 32.93, lng: -96.8 }, plans: ALL_PLANS,
    criteria: [{ kind: "checkins", minDays: 7 }, { kind: "result", name: "Pelvic ultrasound", withinMonths: 12 }],
    providers: ["Dr. Priya Raman (example)"], routes: { fax: { number: "(214) 555-0112", verified: true } },
  }),
  specialist({
    id: "plano-gyno", name: "Plano Gyn Associates (example)", specialty: "gyno", onAttune: true,
    place: { label: "Plano", lat: 33.02, lng: -96.7 }, plans: ["lonestar-ppo", "prairie-epo"], criteria: [],
    providers: ["Dr. M. Okafor (example)"], routes: { direct: "intake@direct.planogyn.example" },
  }),
  specialist({
    id: "uptown-gyno", name: "Uptown Gyn (example)", specialty: "gyno", onAttune: false,
    place: { label: "Uptown, Dallas", lat: 32.8, lng: -96.8 }, plans: ALL_PLANS, criteria: [],
    providers: ["Dr. Nadia Ortiz (example)"], routes: { fax: { number: "(214) 555-0199", verified: true } },
  }),
  specialist({
    id: "lakeside-endo", name: "Lakeside Endocrine (example)", specialty: "endo", onAttune: false,
    place: { label: "Lewisville", lat: 33.05, lng: -96.99 }, plans: ALL_PLANS, criteria: [],
    providers: ["Dr. Grace Kim (example)"], routes: { fax: { number: "(972) 555-0164", verified: false } },
  }),
];

/** Fee terms per practice, from config. Plano accrues on booking to show the trigger is per practice. */
export const DEMO_FEES: World["feeTerms"] = {
  "bluebonnet-endo": { amountCents: 4000, trigger: "visit_attended" },
  "trinity-endo": { amountCents: 4000, trigger: "visit_attended" },
  "ndwc-gyno": { amountCents: 4000, trigger: "visit_attended" },
  "plano-gyno": { amountCents: 4000, trigger: "booked" },
};

const PREFS: WaitlistPrefs = { maxMiles: 15, telehealth: true, days: [1, 2, 3, 4, 5], times: ["morning", "afternoon"], minNoticeHours: 12, paused: false };

/** What the PCP office's own chart holds, as if read from its EMR. Mocked: there is no EMR connection. */
export function demoChart(patientId: string, now: string): Result[] {
  const on = dateOf(ago(now, 58));
  const src = "Cedar Family Medicine chart (example)";
  const base: Result[] = [
    { name: "A1c", value: "5.7 %", range: "4.0–5.6", collectedOn: on, source: src },
    { name: "TSH", value: "2.1 mIU/L", range: "0.45–4.5", collectedOn: on, source: src },
    { name: "Total testosterone", value: "62 ng/dL", range: "8–60", collectedOn: on, source: src },
    { name: "Prolactin", value: "11 ng/mL", range: "4.8–23.3", collectedOn: on, source: src },
  ];
  return patientId === DEMO_IDS.patient || patientId === "p-tn" ? base : [];
}

function labs(now: string, names: string[]): Result[] {
  const on = dateOf(ago(now, 70));
  const values: Record<string, [string, string]> = {
    A1c: ["5.4 %", "4.0–5.6"], TSH: ["1.8 mIU/L", "0.45–4.5"], "Total testosterone": ["48 ng/dL", "8–60"],
    "Pelvic ultrasound": ["Report on file", "—"],
  };
  return names.map((name) => ({ name, value: values[name]?.[0] ?? "", range: values[name]?.[1] ?? "", collectedOn: on, source: "Outside lab (example)" }));
}

function checkIns(now: string, days: number, endDaysAgo: number): CheckIn[] {
  const pattern: Score[][] = [[3, 2, 3, 3], [2, 2, 2, 3], [3, 1, 2, 3], [3, 3, 3, 4], [2, 2, 3, 4], [3, 2, 3, 4], [4, 3, 4, 4], [3, 2, 3, 4], [3, 3, 3, 4]];
  return Array.from({ length: days }, (_, i) => {
    const [mood, sleep, energy, skin] = pattern[i % pattern.length] as [Score, Score, Score, Score];
    return { date: dateOf(ago(now, endDaysAgo + days - 1 - i)), mood, sleep, energy, skin };
  });
}

function person(p: Pick<Patient, "id" | "ref" | "name" | "firstName" | "pcpId"> & Partial<Patient>): Patient {
  return {
    dob: "1995-01-01", home: { label: "Dallas", lat: 32.82, lng: -96.78 }, hasApp: false, onboardedAt: null, story: null,
    checkIns: [], results: [], meds: [], insurance: null, prefs: PREFS, ...p,
  };
}

function waiting(id: string, patientId: string, pcpId: string, specialty: Specialty, status: Referral["status"], signedAt: string, since: string | null): Referral {
  return {
    id, patientId, pcpId, specialty, reason: "Referral for specialist evaluation; see shared record.", urgent: false, status,
    createdAt: signedAt, preparedBy: "Front office (example)", missing: [], waitlistSince: since, slotId: null, summaryId: null,
    signature: { signer: "Referring physician (example)", role: "pcp_physician", attestation: ATTESTATION, at: signedAt },
    route: "attune", faxPracticeId: null, patientUpdate: null,
  };
}

/**
 * The rest of the queue: other patients who make the matching real. None has the app; staff see only refs.
 * Each fails exactly one rule for a cancellation posted in the next few days, on any day of the week, so the demo's
 * offer reaches Ari (SW-8842 needs four days' notice; the form's default slot is never further out than that).
 */
function background(now: string, mode: "fresh" | "fill"): { patients: Patient[]; referrals: Referral[] } {
  const ins = (planId: string, verifiedAt: string | null, issue: string | null = null) => ({ planId, memberIdLast4: "0000", cardCapturedAt: ago(now, 20), verifiedAt, issue });
  const fresh = ago(now, 0, 2);
  const std = labs(now, ["A1c", "TSH", "Total testosterone"]);
  const patients = [
    person({ id: "p-rs", ref: "RS-3307", name: "R. S. (example)", firstName: "R.", pcpId: "cedar", home: { label: "Fort Worth", lat: 32.75, lng: -97.33 }, results: std, insurance: ins("lonestar-ppo", fresh), prefs: { ...PREFS, maxMiles: 10, telehealth: false } }),
    person({ id: "p-tn", ref: "TN-1029", name: "T. N. (example)", firstName: "T.", pcpId: "cedar", results: labs(now, ["A1c"]), insurance: ins("prairie-epo", fresh) }),
    person({ id: "p-dl", ref: "DL-5521", name: "D. L. (example)", firstName: "D.", pcpId: "cedar", results: labs(now, ["Pelvic ultrasound"]), checkIns: checkIns(now, 10, 1), insurance: ins("pecan-pos", fresh) }),
    person({ id: "p-hb", ref: "HB-2204", name: "H. B. (example)", firstName: "H.", pcpId: "cedar" }),
    person({ id: "p-kt", ref: "KT-7740", name: "K. T. (example)", firstName: "K.", pcpId: "oaklawn", results: std, insurance: ins("lonestar-ppo", ago(now, 3)) }),
    person({ id: "p-mo", ref: "MO-2218", name: "M. O. (example)", firstName: "M.", pcpId: "oaklawn", results: std, insurance: ins("gulf-hmo", fresh) }),
    person({ id: "p-sw", ref: "SW-8842", name: "S. W. (example)", firstName: "S.", pcpId: "oaklawn", results: std, insurance: ins("prairie-epo", fresh), prefs: { ...PREFS, minNoticeHours: 96 } }),
    person({ id: "p-lp", ref: "LP-5530", name: "L. P. (example)", firstName: "L.", pcpId: "oaklawn", insurance: ins("pecan-pos", null, "Card photo is blurry; the member ID can't be read.") }),
  ];
  const referrals = [
    waiting("r-1", "p-rs", "cedar", "endo", "on_waitlist", ago(now, 20), ago(now, 19)),
    waiting("r-2", "p-tn", "cedar", "endo", "needs_info", ago(now, 2), null),
    waiting("r-3", "p-dl", "cedar", "gyno", "on_waitlist", ago(now, 13), ago(now, 12)),
    { ...waiting("r-4", "p-hb", "cedar", "gyno", "draft", ago(now, 0, 5), null), signature: null, reason: "", preparedBy: DEMO_PEOPLE.ma },
    waiting("r-5", "p-kt", "oaklawn", "endo", "on_waitlist", ago(now, 10), ago(now, 9)),
    waiting("r-6", "p-mo", "oaklawn", "endo", "on_waitlist", ago(now, 8), ago(now, 7)),
    waiting("r-7", "p-sw", "oaklawn", "endo", "on_waitlist", ago(now, 15), ago(now, 14)),
    waiting("r-8", "p-lp", "oaklawn", "gyno", "insurance_issue", ago(now, 4), null),
  ];
  if (mode === "fill") {
    patients.push(person({ id: "p-jb", ref: "JB-6093", name: "J. B. (example)", firstName: "J.", pcpId: "oaklawn", results: std, insurance: ins("prairie-epo", fresh), prefs: { ...PREFS, maxMiles: 20 } }));
    referrals.push(waiting("r-9", "p-jb", "oaklawn", "endo", "on_waitlist", ago(now, 3), ago(now, 2)));
  }
  const tn = patients.find((p) => p.id === "p-tn");
  const r2 = referrals.find((r) => r.id === "r-2");
  if (tn && r2) r2.missing = checkAcrossSpecialty(DEMO_PRACTICES, tn, r2, now).missing;
  return { patients, referrals };
}

function ari(): Patient {
  return person({
    id: DEMO_IDS.patient, ref: "AL-4821", name: "Ari Lindqvist (example)", firstName: "Ari", dob: "1998-04-09", pcpId: "cedar",
    home: { label: "East Dallas", lat: 32.814, lng: -96.748 }, hasApp: true,
    meds: [
      { name: "Combined oral contraceptive", detail: "Daily", since: "2023", source: "Patient-reported" },
      { name: "Myo-inositol (supplement)", detail: "Daily", since: "2025", source: "Patient-reported" },
    ],
  });
}

function base(now: string, mode: "fresh" | "fill"): World {
  const bg = background(now, mode);
  const patients = [ari(), ...bg.patients];
  const consents: Consent[] = bg.patients.map((p) => ({
    patientId: p.id, recipientId: p.pcpId, section: "story" as const, grantedAt: ago(now, 21), revokedAt: null, via: "share_code" as const,
  }));
  for (const p of bg.patients) {
    for (const section of ["trends", "results", "meds", "insurance", "summaries"] as const) {
      consents.push({ patientId: p.id, recipientId: p.pcpId, section, grantedAt: ago(now, 21), revokedAt: null, via: "share_code" });
    }
  }
  return {
    schema: 4, clock: { speed: DEFAULT_DEMO_SPEED, pausedAt: null, offsetMs: 0 }, plans: DEMO_PLANS, practices: DEMO_PRACTICES,
    feeTerms: DEMO_FEES, patients, referrals: bg.referrals, slots: [], offers: [], consents, views: [], shareCodes: [], summaries: [],
    ledger: [], notices: [], log: [], assistants: [], journal: [], proposals: [],
  };
}

/**
 * `fresh`: Ari just installed the app. `fill`: the handoff's demo start, with her referral signed, insurance
 * verified and her six days into the waitlist, ready for the endo office to post a cancellation.
 */
export function demoWorld(now: string, mode: "fresh" | "fill"): World {
  let w = base(now, mode);
  if (mode === "fresh") return w;

  const id = DEMO_IDS.patient;
  const as = { patient: { by: "patient" as const, who: DEMO_PEOPLE.patient }, ma: { by: "pcp_ma" as const, who: DEMO_PEOPLE.ma } };
  // Her morning check-ins land between the other steps, so the audit log stays in time order.
  const pending = checkIns(now, 9, 1).map((checkIn) => ({ at: `${checkIn.date}T13:30:00.000Z`, checkIn }));
  const step = (cmd: Command, at: string) => {
    while (pending[0] && pending[0].at < at) {
      const next = pending.shift();
      if (next) w = run(w, { ...as.patient, type: "logCheckIn", patientId: id, checkIn: next.checkIn }, next.at);
    }
    w = run(w, cmd, at);
  };

  step({ ...as.patient, type: "completeOnboarding", patientId: id, hardest: ["Sleep", "Mood", "Irregular cycles"], helpWith: ["Seeing a specialist sooner", "Not retelling my story"], tried: ["Birth control", "Inositol"] }, ago(now, 10));
  step({ ...as.patient, type: "editStory", patientId: id, words: "My cycles have been 40 to 60 days apart for about three years. The week before is the hardest: I sleep badly and feel flat. I've told this story to four doctors and I'd like to tell it once." }, ago(now, 10));

  step({ ...as.patient, type: "createShareCode", patientId: id, sections: ["story", "trends", "results", "meds", "insurance", "summaries"] }, ago(now, 8));
  step({ ...as.ma, type: "redeemShareCode", code: w.shareCodes.at(-1)?.code ?? "", dob: "1998-04-09", practiceId: "cedar" }, ago(now, 8, -0.05));
  step({ ...as.ma, type: "viewRecord", patientId: id, recipientId: "cedar", sections: ["story", "trends", "results", "meds"] }, ago(now, 8, -0.1));
  step({ ...as.ma, type: "startReferral", patientId: id, pcpId: "cedar", specialty: "endo" }, ago(now, 7));
  const referralId = w.referrals.at(-1)?.id ?? "";
  for (const result of demoChart(id, now)) step({ ...as.ma, type: "attachResult", referralId, result }, ago(now, 7));
  step({
    by: "pcp_physician", who: DEMO_PEOPLE.physician, type: "signAndSend", referralId, urgent: false, attested: true, faxPracticeId: null,
    reason: "Cycles 40–60 days apart for three years and total testosterone above range on the last panel. Please evaluate and co-manage; she'd like one plan her doctors share.",
  }, ago(now, 7, -0.5));
  step({ ...as.patient, type: "captureInsuranceCard", patientId: id, planId: "lonestar-ppo", memberIdLast4: "0417" }, ago(now, 6, 2));
  step({ by: "ops", who: DEMO_PEOPLE.ops, type: "verifyInsurance", patientId: id }, ago(now, 6));
  step({ by: "ops", who: DEMO_PEOPLE.ops, type: "verifyInsurance", patientId: id }, ago(now, 0, 1));
  return w;
}
