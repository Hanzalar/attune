/**
 * Words every view uses for statuses and sections, so a referral reads the same to her, the MA and the front desk.
 * Tones map to icon + color in the UI; the word always carries the meaning.
 */
import type { DayPart, OfferStatus, ReferralStatus, SectionKey, SlotStatus, Specialty, VisitMode, Weekday } from "./types";

export type Tone = "neutral" | "progress" | "attention" | "issue" | "done";

export const SPECIALTY: Record<Specialty, { label: string; short: string; office: string }> = {
  gyno: { label: "Gynecology", short: "Gyno", office: "gynecologist" },
  endo: { label: "Endocrinology", short: "Endo", office: "endocrinologist" },
};

export const SECTION: Record<SectionKey, { label: string; detail: string }> = {
  story: { label: "Your story", detail: "In your own words, plus what you picked at the start" },
  trends: { label: "Check-in trends", detail: "Mood, sleep, energy and skin from your daily check-ins" },
  results: { label: "Labs and results", detail: "Results on file, with the lab and date" },
  meds: { label: "Medications", detail: "What you take now and what you have tried" },
  insurance: { label: "Insurance", detail: "Plan and member ID, not the card photo" },
  summaries: { label: "Visit summaries", detail: "What specialists send back after a visit" },
  journal: { label: "Journal", detail: "What you write in Attune, in your words" },
  care: { label: "Referrals and visits", detail: "Referral status, booked visits and who has your Pack" },
};

/** Clinician-facing section names. */
export const SECTION_STAFF: Record<SectionKey, string> = {
  story: "Patient story",
  trends: "Symptom trends (patient-logged)",
  results: "Labs and results",
  meds: "Medications",
  insurance: "Insurance",
  summaries: "Visit summaries",
  journal: "Patient journal",
  care: "Referrals and visits",
};

export const REFERRAL_STATUS: Record<ReferralStatus, { label: string; tone: Tone; patient: string }> = {
  draft: { label: "Draft", tone: "neutral", patient: "Your PCP's office is preparing a referral." },
  sent: { label: "Sent", tone: "progress", patient: "Your PCP signed your referral. We're checking it now." },
  needs_info: { label: "Needs info", tone: "attention", patient: "Your PCP's office is adding something the specialists ask for." },
  qualified: { label: "Qualified", tone: "progress", patient: "Your referral is complete." },
  insurance_pending: { label: "Insurance pending", tone: "attention", patient: "One step left: add your insurance card." },
  insurance_issue: { label: "Insurance issue", tone: "issue", patient: "We couldn't confirm your coverage yet." },
  on_waitlist: { label: "On waitlist", tone: "progress", patient: "You're on the list. We'll tell you when a time opens." },
  offered: { label: "Offered", tone: "attention", patient: "A time is being held for you." },
  booked: { label: "Booked", tone: "done", patient: "You're booked." },
  seen: { label: "Seen", tone: "done", patient: "Your visit happened. The summary is on its way." },
  summary_received: { label: "Summary received", tone: "done", patient: "Your visit summary arrived." },
  closed: { label: "Closed", tone: "done", patient: "Done. Your PCP has the summary too." },
};

export const SLOT_STATUS: Record<SlotStatus, { label: string; tone: Tone }> = {
  open: { label: "Open", tone: "neutral" },
  offering: { label: "Offering", tone: "attention" },
  filled: { label: "Filled", tone: "done" },
  confirmed: { label: "Confirmed", tone: "done" },
  completed: { label: "Completed", tone: "done" },
  unfilled: { label: "Unfilled", tone: "issue" },
  withdrawn: { label: "Withdrawn", tone: "neutral" },
};

export const OFFER_STATUS: Record<OfferStatus, { label: string; tone: Tone }> = {
  pending: { label: "Pending", tone: "attention" },
  accepted: { label: "Accepted", tone: "done" },
  declined: { label: "Declined", tone: "neutral" },
  expired: { label: "Expired", tone: "neutral" },
  superseded: { label: "Superseded", tone: "neutral" },
};

export const MODE: Record<VisitMode, string> = { in_person: "In person", telehealth: "Telehealth" };

export const WEEKDAYS: { day: Weekday; short: string; long: string }[] = [
  { day: 1, short: "Mon", long: "Monday" },
  { day: 2, short: "Tue", long: "Tuesday" },
  { day: 3, short: "Wed", long: "Wednesday" },
  { day: 4, short: "Thu", long: "Thursday" },
  { day: 5, short: "Fri", long: "Friday" },
  { day: 6, short: "Sat", long: "Saturday" },
  { day: 0, short: "Sun", long: "Sunday" },
];

export const DAY_PARTS: { part: DayPart; label: string; hours: string }[] = [
  { part: "morning", label: "Mornings", hours: "before noon" },
  { part: "afternoon", label: "Afternoons", hours: "noon to 5" },
  { part: "evening", label: "Evenings", hours: "after 5" },
];

export const ROLE_LABEL: Record<string, string> = {
  patient: "Patient",
  pcp_ma: "PCP medical assistant",
  pcp_physician: "PCP physician",
  specialist_staff: "Specialist front desk",
  specialist_provider: "Specialist",
  ops: "Attune operations",
  agent: "Attune",
  assistant: "AI assistant (connected by the patient)",
};

export const CHECKIN_SCALES: Record<"mood" | "sleep" | "energy" | "skin", { label: string; low: string; high: string }> = {
  mood: { label: "Mood", low: "Low", high: "Good" },
  sleep: { label: "Sleep", low: "Rough", high: "Rested" },
  energy: { label: "Energy", low: "Drained", high: "Steady" },
  skin: { label: "Skin", low: "Flared", high: "Calm" },
};
