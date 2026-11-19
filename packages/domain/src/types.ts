/**
 * Attune's shared record: one patient-owned record, the referrals built on it, the cancellation slots practices post,
 * the offers Attune sends, and the consent, view, audit and fee trails around them. Everything is plain data so the
 * hosted views can store it, sync it across tabs and replay it.
 */

/**
 * Who can act. `agent` is Attune itself: it checks, matches and delivers; it never signs or decides who qualifies.
 * `assistant` is an AI assistant she connected (Claude, ChatGPT): it reads what she grants and drafts; she approves.
 */
export type Role = "patient" | "pcp_ma" | "pcp_physician" | "specialist_staff" | "specialist_provider" | "ops" | "agent" | "assistant";

export type Specialty = "gyno" | "endo";

/** Sections of her record. Consent is granted per section, per recipient. `journal` and `care` go only to assistants. */
export type SectionKey = "story" | "trends" | "results" | "meds" | "insurance" | "summaries" | "journal" | "care";

export type PlanType = "HMO" | "POS" | "EPO" | "PPO";

/** 0 is Sunday, as in `Date.getDay()`. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type DayPart = "morning" | "afternoon" | "evening";
export type Score = 1 | 2 | 3 | 4 | 5;

export interface Place {
  label: string;
  lat: number;
  lng: number;
}

export interface Plan {
  id: string;
  carrier: string;
  name: string;
  type: PlanType;
}

/** What she told us at onboarding, and her story in her own words. Never interpreted, only shown. */
export interface Story {
  hardest: string[];
  helpWith: string[];
  tried: string[];
  words: string;
}

/** One day's check-in. She rates whichever scales she wants; a journal draft may fill only some. */
export interface CheckIn {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  mood?: Score;
  sleep?: Score;
  energy?: Score;
  skin?: Score;
}

/** A lab or imaging result already on file. Shown with its source and the lab's own range; Attune adds no flags. */
export interface Result {
  name: string;
  value: string;
  range: string;
  /** YYYY-MM-DD. */
  collectedOn: string;
  source: string;
}

export interface Med {
  name: string;
  detail: string;
  since: string;
  source: string;
}

export interface Insurance {
  planId: string;
  memberIdLast4: string;
  /** When she photographed her card. The photo itself is not stored in the demo. */
  cardCapturedAt: string | null;
  /** Last eligibility check. Offers need one inside `INSURANCE_FRESH_HOURS`. */
  verifiedAt: string | null;
  /** Set when the check fails; cleared by a later verification. */
  issue: string | null;
}

export interface WaitlistPrefs {
  maxMiles: number;
  telehealth: boolean;
  days: Weekday[];
  times: DayPart[];
  /** The shortest notice she can handle, in hours. */
  minNoticeHours: number;
  paused: boolean;
}

export interface Patient {
  id: string;
  /** Short reference shown to staff, e.g. on the PCP board. */
  ref: string;
  /** Display name. Synthetic and labelled in demo data. */
  name: string;
  firstName: string;
  dob: string;
  pcpId: string;
  home: Place;
  /** True for the patient who has the app in the demo; the rest exist so matching has a real queue. */
  hasApp: boolean;
  onboardedAt: string | null;
  story: Story | null;
  checkIns: CheckIn[];
  results: Result[];
  meds: Med[];
  insurance: Insurance | null;
  prefs: WaitlistPrefs;
}

/**
 * What a specialist practice requires before a referral counts as complete. A signed PCP referral with a reason is
 * always required and is not listed here. Checked against her record, which includes results the PCP office attached.
 */
export type Requirement =
  | { kind: "result"; name: string; withinMonths: number }
  | { kind: "checkins"; minDays: number }
  | { kind: "section"; section: SectionKey };

export interface DeliveryRoutes {
  fax?: { number: string; verified: boolean };
  direct?: string;
}

export interface Practice {
  id: string;
  name: string;
  kind: "pcp" | "specialist";
  specialty: Specialty | null;
  /** On Attune: uses the specialist portal. Off Attune: reached by the fax or Direct fallback only. */
  onAttune: boolean;
  place: Place;
  /** IANA zone used for weekday and time-of-day checks. */
  timeZone: string;
  /** Plan ids the practice accepts. */
  plans: string[];
  criteria: Requirement[];
  providers: string[];
  staff: { name: string; role: Role }[];
  routes: DeliveryRoutes;
}

/**
 * Per-practice fee terms. Kept apart from `Practice` so matching code cannot read them by accident.
 * Prototype only: fees accrue in the ledger and nothing is charged.
 */
export interface FeeTerms {
  amountCents: number;
  trigger: "visit_attended" | "booked";
}

export type ReferralStatus =
  | "draft"
  | "sent"
  | "needs_info"
  | "qualified"
  | "insurance_pending"
  | "insurance_issue"
  | "on_waitlist"
  | "offered"
  | "booked"
  | "seen"
  | "summary_received"
  | "closed";

export interface Signature {
  signer: string;
  role: Role;
  attestation: string;
  at: string;
}

export interface Referral {
  id: string;
  patientId: string;
  pcpId: string;
  specialty: Specialty;
  reason: string;
  /** PCP urgency flag. The only clinical input to offer order. */
  urgent: boolean;
  status: ReferralStatus;
  createdAt: string;
  preparedBy: string;
  signature: Signature | null;
  /** Items still missing for every practice in the specialty, when status is `needs_info`. */
  missing: string[];
  waitlistSince: string | null;
  slotId: string | null;
  summaryId: string | null;
  /** `fax`: sent to an off-Attune practice through the fallback; it never joins the waitlist. */
  route: "attune" | "fax";
  faxPracticeId: string | null;
  /** What she said changed when confirming the day before. */
  patientUpdate: string | null;
}

export type SlotStatus = "open" | "offering" | "filled" | "confirmed" | "completed" | "unfilled" | "withdrawn";
export type VisitMode = "in_person" | "telehealth";

export interface Slot {
  id: string;
  practiceId: string;
  provider: string;
  specialty: Specialty;
  startsAt: string;
  minutes: number;
  mode: VisitMode;
  status: SlotStatus;
  postedAt: string;
  postedBy: string;
  /** Offer rounds sent so far. */
  rounds: number;
  referralId: string | null;
  unfilledReason: string | null;
  reminderSent: boolean;
}

export type OfferStatus = "pending" | "accepted" | "declined" | "expired" | "superseded";

export interface Offer {
  id: string;
  slotId: string;
  referralId: string;
  patientId: string;
  round: number;
  sentAt: string;
  expiresAt: string;
  status: OfferStatus;
  respondedAt: string | null;
}

export interface Consent {
  patientId: string;
  recipientId: string;
  section: SectionKey;
  grantedAt: string;
  revokedAt: string | null;
  via: "share_code" | "offer" | "patient" | "assistant";
}

export interface RecordView {
  at: string;
  patientId: string;
  recipientId: string;
  viewer: string;
  sections: SectionKey[];
}

export interface ShareCode {
  code: string;
  patientId: string;
  sections: SectionKey[];
  createdAt: string;
  expiresAt: string;
  redeemedBy: string | null;
  redeemedAt: string | null;
}

export interface VisitSummary {
  id: string;
  referralId: string;
  slotId: string;
  practiceId: string;
  author: string;
  at: string;
  text: string;
  followUp: string;
  backToPcp: boolean;
}

export interface LedgerEntry {
  id: string;
  /** Always a specialist practice. No field anywhere pays a PCP or a patient. */
  practiceId: string;
  referralId: string;
  slotId: string;
  amountCents: number;
  trigger: FeeTerms["trigger"];
  accruedAt: string;
  billed: false;
}

export interface Notice {
  id: string;
  at: string;
  to: { kind: "patient" | "practice"; id: string };
  channel: "push" | "in_app";
  /** Text that leaves the app. Never carries health details. */
  text: string;
}

export interface AuditEvent {
  seq: number;
  at: string;
  by: Role;
  who: string;
  type: string;
  summary: string;
  patientId: string | null;
  /** What left her record with this event, and to whom. */
  shared?: { recipientId: string; sections: SectionKey[] };
}

/** An AI assistant she connected. The token identifies its connector; it reads only sections she grants. */
export interface AssistantLink {
  assistantId: string;
  patientId: string;
  token: string;
  connectedAt: string;
  disconnectedAt: string | null;
}

export interface JournalEntry {
  id: string;
  patientId: string;
  at: string;
  text: string;
  /** Who wrote it: her, in the app, or an assistant on her behalf (e.g. she journaled in Claude). */
  source: "patient" | string;
  /** The assistant's short acknowledgement, if any. Never advice. */
  reply: string | null;
  replyBy: string | null;
}

/** A change an assistant drafted from her journal. Nothing changes her record until she applies it. */
export type Proposal =
  | { kind: "checkIn"; date: string; mood?: Score; sleep?: Score; energy?: Score; skin?: Score }
  | { kind: "addMed"; name: string; detail: string }
  | { kind: "stopMed"; name: string }
  | { kind: "storyNote"; text: string };

export interface ProposalRecord {
  id: string;
  patientId: string;
  entryId: string | null;
  by: string;
  at: string;
  proposal: Proposal;
  /** The words in her entry it came from. */
  why: string;
  status: "pending" | "applied" | "dismissed";
  decidedAt: string | null;
}

export interface Clock {
  /** Hold windows run this many times faster than real time. 1 outside demo mode. */
  speed: number;
  /** Set while timers are paused, so holds can be extended on resume. */
  pausedAt: string | null;
  /** Demo clock offset in ms, used to skip ahead to a visit. */
  offsetMs: number;
}

export interface World {
  schema: 4;
  clock: Clock;
  plans: Plan[];
  practices: Practice[];
  feeTerms: Record<string, FeeTerms>;
  patients: Patient[];
  referrals: Referral[];
  slots: Slot[];
  offers: Offer[];
  consents: Consent[];
  views: RecordView[];
  shareCodes: ShareCode[];
  summaries: VisitSummary[];
  ledger: LedgerEntry[];
  notices: Notice[];
  log: AuditEvent[];
  assistants: AssistantLink[];
  journal: JournalEntry[];
  proposals: ProposalRecord[];
}
