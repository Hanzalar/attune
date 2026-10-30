/** Who can act on a referral. `agent` is Attune itself; it drafts and delivers, it never approves. */
export type Role =
  | "patient"
  | "pcp_ma"
  | "pcp_physician"
  | "specialist_staff"
  | "specialist_provider"
  | "agent";

export type PlanType = "HMO" | "POS" | "EPO" | "PPO";

export type NetworkStatus = "in" | "out" | "unknown";

/** How a specialist office receives referrals today. Preference order lives in `chooseChannel`. */
export interface DeliveryRoutes {
  /** A verified e-fax number. Unverified numbers are not routes. */
  fax?: { number: string; verified: boolean };
  /** A Direct secure messaging address (DirectTrust). */
  direct?: string;
  /** A FHIR endpoint that accepts BSeR-style ServiceRequest + Task (v2+). */
  fhir?: string;
}

export interface Specialist {
  id: string;
  name: string;
  practice: string;
  specialty: "OB/GYN" | "Endocrinology" | "REI" | "Dermatology";
  npi: string;
  network: NetworkStatus;
  /** Days until the soonest new-patient opening; `null` means waitlist only. */
  soonestDays: number | null;
  soonestLabel: string;
  miles: number;
  /** 0 = general, 1 = some, 2 = sees PMOS patients often. Self-reported by the practice or from our partner list. */
  pmosExperience: 0 | 1 | 2;
  fitNote: string;
  /** New-patient openings a patient can request up front. Empty means waitlist only. */
  openSlots: Slot[];
  routes: DeliveryRoutes;
  ehr: string;
  /**
   * Commercial relationship with Attune. Present for billing and reporting only.
   * Ranking code MUST NOT read this field (constitution rule: never rank by who pays).
   */
  partner: boolean;
}

export type ShareKey = "tracker" | "photos" | "portal" | "labs" | "uploads";

export interface ShareItem {
  key: ShareKey;
  title: string;
  detail: string;
  /** Where the data came from, shown next to every item the specialist sees. */
  source: string;
}

export type Stage =
  | "draft"
  | "awaiting_pcp"
  | "awaiting_physician"
  | "signed"
  | "sent"
  | "offered"
  | "booked"
  | "visited"
  | "closed"
  | "declined"
  | "withdrawn";

export type Channel = "fhir" | "direct" | "efax";

export interface Slot {
  label: string;
  at: string;
}

export interface AuditEvent {
  seq: number;
  at: string;
  by: Role;
  type: Command["type"];
  summary: string;
  /** Share keys that left Attune with this event, if any. */
  shared?: ShareKey[];
}

export interface Referral {
  id: string;
  patientRef: string;
  fromPractice: string;
  toSpecialty: Specialist["specialty"];
  plan: PlanType;
  stage: Stage;
  specialistId: string | null;
  share: Record<ShareKey, boolean>;
  waitlist: boolean;
  codes: string[];
  signatures: { ma?: string; physician?: string };
  channel: Channel | null;
  /** The opening the patient picked before approving; held until the specialist office confirms it. */
  requestedSlot: Slot | null;
  offeredSlot: Slot | null;
  bookedSlot: Slot | null;
  openRequests: string[];
  outcome: string | null;
  note: string | null;
  consent: { grantedAt: string | null; revokedAt: string | null };
  log: AuditEvent[];
}

export type Command =
  | { type: "chooseSpecialist"; by: Role; at: string; specialistId: string }
  | { type: "toggleShare"; by: Role; at: string; key: ShareKey }
  | { type: "setWaitlist"; by: Role; at: string; on: boolean }
  | { type: "holdSlot"; by: Role; at: string; slot: Slot }
  | { type: "approveSharing"; by: Role; at: string }
  | { type: "signReferral"; by: Role; at: string; codes: string[]; signer: string }
  | { type: "deliver"; by: Role; at: string; channel: Channel }
  | { type: "offerSlot"; by: Role; at: string; slot: Slot }
  | { type: "confirmRequestedSlot"; by: Role; at: string }
  | { type: "requestRecords"; by: Role; at: string; note: string }
  | { type: "declineReferral"; by: Role; at: string; note: string }
  | { type: "bookSlot"; by: Role; at: string }
  | { type: "completeVisit"; by: Role; at: string; outcome: string }
  | { type: "closeLoop"; by: Role; at: string }
  | { type: "revokeConsent"; by: Role; at: string };
