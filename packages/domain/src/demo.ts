/**
 * Synthetic demo record. Every person and practice here is invented; the public repo holds no PHI.
 * The hosted views and the tests both read this so the demo and the rules never drift apart.
 */
import { newReferral } from "./referral";
import type { EvidenceInput } from "./evidence";
import type { Referral, ShareItem, Specialist } from "./types";

export const DEMO_PATIENT = {
  ref: "MK-2291",
  firstName: "Maya",
  age: 29,
  phenotype: "Insulin-resistant type",
  daysTracked: 168,
  plan: "PPO" as const,
  goals: "More regular cycles and clear skin. Not trying to conceive now. Wants a plan beyond birth control.",
  questions: "Fasting insulin and HOMA-IR? Keep inositol or add metformin? Which metabolic labs are overdue?",
};

export const DEMO_PCP = {
  practice: "Cedar Family Medicine (example)",
  ehr: "Tebra",
  fax: "(214) 555-0140",
  direct: null as string | null,
  staff: [
    { name: "Alex R. (example)", role: "pcp_ma" as const, title: "Medical assistant" },
    { name: "Dr. Sam Patel (example)", role: "pcp_physician" as const, title: "Physician" },
  ],
};

export const DEMO_SPECIALISTS: Specialist[] = [
  {
    id: "raman", name: "Dr. Priya Raman (example)", practice: "North Dallas Women's Care", specialty: "OB/GYN",
    npi: "1000000017", network: "in", soonestDays: 13, soonestLabel: "Nov 12", miles: 4.2, pmosExperience: 2,
    fitNote: "Sees PMOS patients often", routes: { fax: { number: "(214) 555-0112", verified: true } }, ehr: "athenahealth", partner: true,
  },
  {
    id: "cole", name: "Dr. Lauren Cole (example)", practice: "Plano Gyn Associates", specialty: "OB/GYN",
    npi: "1000000025", network: "in", soonestDays: 34, soonestLabel: "Dec 3", miles: 6.8, pmosExperience: 1,
    fitNote: "Fertility focus", routes: { direct: "intake@direct.planogyn.example" }, ehr: "Epic", partner: false,
  },
  {
    id: "hill", name: "Dr. Marcus Hill (example)", practice: "Richardson OB/GYN", specialty: "OB/GYN",
    npi: "1000000033", network: "in", soonestDays: null, soonestLabel: "Waitlist", miles: 9.1, pmosExperience: 0,
    fitNote: "General OB/GYN", routes: { fax: { number: "(972) 555-0177", verified: true } }, ehr: "athenahealth", partner: true,
  },
  {
    id: "ortiz", name: "Dr. Elena Ortiz (example)", practice: "Uptown Gyn", specialty: "OB/GYN",
    npi: "1000000041", network: "out", soonestDays: 5, soonestLabel: "Nov 4", miles: 3.0, pmosExperience: 2,
    fitNote: "Out of network for this plan", routes: { fax: { number: "(214) 555-0199", verified: false } }, ehr: "Unknown", partner: false,
  },
];

export const DEMO_SHARE_ITEMS: ShareItem[] = [
  { key: "tracker", title: "Tracker summary · 168 days", detail: "Cycles, symptoms, trials", source: "Attune tracker" },
  { key: "photos", title: "Photo trend (mFG 12 to 9)", detail: "From your skin / hair photos", source: "Attune photos" },
  { key: "portal", title: "Portal notes · 3 visits", detail: "Pulled from your PCP's portal", source: "PCP portal (FHIR)" },
  { key: "labs", title: "Labs · 2 panels", detail: "LabCorp, last 12 months", source: "LabCorp" },
  { key: "uploads", title: "Uploaded PDF · 1", detail: "Ultrasound report you added", source: "Patient upload" },
];

export const DEMO_EVIDENCE: EvidenceInput = {
  cycleLengths: [58, 46, 61, 44, 41],
  mfgScores: [12, 11, 10, 9, 9],
  labs: { homaIr: 3.8 },
  ultrasoundReportOnFile: true,
  sources: { cycles: "Attune tracker", photos: "Attune photos", labs: "LabCorp", uploads: "Patient upload" },
};

export const DEMO_SERIES = {
  trial: [
    { wk: "W1", acne: 7, adh: 0, energy: 4 }, { wk: "W2", acne: 7, adh: 0, energy: 4 },
    { wk: "W3", acne: 8, adh: 0, energy: 3 }, { wk: "W4", acne: 7, adh: 55, energy: 4 },
    { wk: "W5", acne: 6, adh: 85, energy: 5 }, { wk: "W6", acne: 6, adh: 90, energy: 5 },
    { wk: "W7", acne: 5, adh: 88, energy: 6 }, { wk: "W8", acne: 4, adh: 95, energy: 6 },
    { wk: "W9", acne: 4, adh: 92, energy: 7 }, { wk: "W10", acne: 3, adh: 100, energy: 7 },
    { wk: "W11", acne: 3, adh: 96, energy: 7 }, { wk: "W12", acne: 3, adh: 98, energy: 8 },
  ],
  acneByPhase: [
    { phase: "Menses", acne: 4 }, { phase: "Follicular", acne: 3 },
    { phase: "Ovulation", acne: 5 }, { phase: "Luteal", acne: 8 },
  ],
  mfg: [
    { m: "Jan", score: 12 }, { m: "Mar", score: 11 }, { m: "May", score: 10 },
    { m: "Jul", score: 9 }, { m: "Sep", score: 9 },
  ],
};

/** Other items in the PCP queue, built by hand today. They show the contrast with an agent-drafted referral. */
export const DEMO_MANUAL_QUEUE = [
  { id: "JT-1180", to: "Dermatology", reason: "Changing mole, left shoulder", status: "Find provider" },
  { id: "AL-0042", to: "Sleep study", reason: "Suspected sleep apnea", status: "Fax pending" },
];

export const DEMO_WAITLIST = [
  { id: "RS-3307", note: "Waiting 19 days" },
  { id: "DL-5521", note: "Waiting 6 days" },
];

export const DEMO_SLOT = { label: "Nov 12, 2:40 PM", at: "2026-11-12T14:40:00-06:00" };

export function demoReferral(): Referral {
  return newReferral({
    id: "ref-mk-2291",
    patientRef: DEMO_PATIENT.ref,
    fromPractice: DEMO_PCP.practice,
    plan: DEMO_PATIENT.plan,
    specialistId: "raman",
  });
}
