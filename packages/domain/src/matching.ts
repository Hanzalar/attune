/**
 * Who gets offered a cancelled slot, and in what order.
 *
 * Eligibility follows the handoff's rules exactly. Order is PCP urgency flag, then longest on the waitlist, then
 * nearest. Nothing here reads fee terms, payer, plan type or any other patient trait (constitution rule 3); the
 * invariance tests in test/matching.test.ts keep it that way. Practices never see this queue.
 */
import { HOLD_POLICY, INSURANCE_FRESH_HOURS, type HoldRule } from "./config";
import { checkCompleteness } from "./criteria";
import { dayPart, hoursUntil, localParts, milesBetween } from "./time";
import type { Referral, Slot, World } from "./types";

export type SkipReason =
  | "not_waiting"
  | "live_offer"
  | "specialty"
  | "paused"
  | "plan"
  | "insurance_stale"
  | "criteria"
  | "telehealth"
  | "distance"
  | "day"
  | "time"
  | "notice"
  | "already_offered";

/** Plain words for why a waiting patient was not offered a slot. Shown to practices only as counts. */
export const SKIP_LABEL: Record<SkipReason, string> = {
  not_waiting: "not on the waitlist yet",
  live_offer: "already holding another offer",
  specialty: "referred to a different specialty",
  paused: "paused their waitlist",
  plan: "plan not accepted here",
  insurance_stale: "insurance check out of date",
  criteria: "referral not complete for this practice",
  telehealth: "not open to telehealth",
  distance: "too far away",
  day: "day doesn't work",
  time: "time of day doesn't work",
  notice: "needs more notice",
  already_offered: "already offered this slot",
};

/** The only fields ordering may read. */
export interface OrderInput {
  referralId: string;
  urgent: boolean;
  waitlistSince: string;
  miles: number;
}

export interface Candidate extends OrderInput {
  patientId: string;
}

export type Evaluation = { ok: true; candidate: Candidate } | { ok: false; reason: SkipReason };

export function evaluate(w: World, slot: Slot, referral: Referral, now: string): Evaluation {
  const no = (reason: SkipReason): Evaluation => ({ ok: false, reason });
  const patient = w.patients.find((p) => p.id === referral.patientId);
  const practice = w.practices.find((p) => p.id === slot.practiceId);
  if (!patient || !practice) return no("not_waiting");

  if (referral.route !== "attune" || referral.specialty !== slot.specialty) return no("specialty");
  const holding = w.offers.some((o) => o.patientId === patient.id && o.status === "pending");
  if (referral.status === "offered" || holding) return no("live_offer");
  if (referral.status !== "on_waitlist" || referral.signature === null || referral.waitlistSince === null) return no("not_waiting");
  if (patient.prefs.paused) return no("paused");

  const ins = patient.insurance;
  if (!ins || !practice.plans.includes(ins.planId)) return no("plan");
  if (!ins.verifiedAt || ins.issue || hoursUntil(ins.verifiedAt, now) > INSURANCE_FRESH_HOURS) return no("insurance_stale");
  if (!checkCompleteness(practice, patient, referral, now).complete) return no("criteria");

  let miles = 0;
  if (slot.mode === "telehealth") {
    if (!patient.prefs.telehealth) return no("telehealth");
  } else {
    miles = milesBetween(patient.home, practice.place);
    if (miles > patient.prefs.maxMiles) return no("distance");
  }

  const local = localParts(slot.startsAt, practice.timeZone);
  if (!patient.prefs.days.includes(local.weekday)) return no("day");
  if (!patient.prefs.times.includes(dayPart(local.hour))) return no("time");
  if (hoursUntil(now, slot.startsAt) < patient.prefs.minNoticeHours) return no("notice");
  if (w.offers.some((o) => o.slotId === slot.id && o.referralId === referral.id)) return no("already_offered");

  return {
    ok: true,
    candidate: { referralId: referral.id, patientId: patient.id, urgent: referral.urgent, waitlistSince: referral.waitlistSince, miles },
  };
}

/** PCP urgency flag first, then longest on the waitlist, then nearest. Ties break on id so the order is stable. */
export function orderCandidates<T extends OrderInput>(list: readonly T[]): T[] {
  return [...list].sort(
    (a, b) =>
      Number(b.urgent) - Number(a.urgent) ||
      a.waitlistSince.localeCompare(b.waitlistSince) ||
      a.miles - b.miles ||
      a.referralId.localeCompare(b.referralId),
  );
}

export interface Match {
  eligible: Candidate[];
  skipped: Partial<Record<SkipReason, number>>;
  /** Referrals for this specialty that are waiting or holding an offer. */
  waiting: number;
}

export function matchSlot(w: World, slot: Slot, now: string): Match {
  const pool = w.referrals.filter(
    (r) => r.route === "attune" && r.specialty === slot.specialty && (r.status === "on_waitlist" || r.status === "offered"),
  );
  const eligible: Candidate[] = [];
  const skipped: Partial<Record<SkipReason, number>> = {};
  for (const r of pool) {
    const e = evaluate(w, slot, r, now);
    if (e.ok) eligible.push(e.candidate);
    else skipped[e.reason] = (skipped[e.reason] ?? 0) + 1;
  }
  return { eligible: orderCandidates(eligible), skipped, waiting: pool.length };
}

export function holdRule(startsAt: string, now: string): HoldRule {
  const lead = hoursUntil(now, startsAt);
  const rule = HOLD_POLICY.find((r) => lead > r.aboveHours);
  if (!rule) throw new Error("HOLD_POLICY must end with a catch-all rule.");
  return rule;
}

/** Hold length in ms at the given demo speed, never running past the start of the visit. */
export function holdMs(startsAt: string, now: string, speed: number): number {
  const rule = holdRule(startsAt, now);
  const untilStart = new Date(startsAt).getTime() - new Date(now).getTime();
  return Math.max(0, Math.min((rule.holdMinutes * 60_000) / speed, untilStart));
}

/** Why nobody was offered, as counts a practice may see. No patient is identifiable from it. */
export function describeSkips(m: Match): string {
  const parts = Object.entries(m.skipped)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .map(([reason, n]) => `${n} ${SKIP_LABEL[reason as SkipReason]}`);
  if (m.waiting === 0) return "Nobody is waiting for this specialty right now.";
  return `None of the ${m.waiting} waiting matched: ${parts.join(", ")}.`;
}
