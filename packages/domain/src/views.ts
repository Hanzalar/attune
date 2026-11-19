/**
 * Read models for the hosted views. Views render these; they don't re-derive rules. All pure: pass `now`.
 */
import { CONFIRM_WINDOW_HOURS } from "./config";
import { canSee } from "./consent";
import { localParts, hoursUntil, ms } from "./time";
import type { CheckIn, Offer, Practice, Referral, SectionKey, Slot, VisitSummary, World } from "./types";
import { currentReferral } from "./world";

export interface PatientHome {
  /** A live offer always comes first on Home. */
  offer: { offer: Offer; slot: Slot; practice: Practice; msLeft: number } | null;
  referral: Referral | null;
  booked: { slot: Slot; practice: Practice; canConfirm: boolean } | null;
  summary: VisitSummary | null;
  checkedInToday: boolean;
  streak: number;
}

export function todayIn(now: string, timeZone: string): string {
  return localParts(now, timeZone).date;
}

/** Consecutive days with a check-in, counting back from today (or yesterday, if today isn't logged yet). */
export function streak(checkIns: CheckIn[], today: string): number {
  const days = new Set(checkIns.map((c) => c.date));
  const step = (d: string) => new Date(new Date(`${d}T12:00:00Z`).getTime() - 86_400_000).toISOString().slice(0, 10);
  let day = days.has(today) ? today : step(today);
  let n = 0;
  while (days.has(day)) {
    n += 1;
    day = step(day);
  }
  return n;
}

export function patientHome(w: World, patientId: string, now: string, timeZone: string): PatientHome {
  const patient = w.patients.find((p) => p.id === patientId);
  const pending = w.offers.find((o) => o.patientId === patientId && o.status === "pending" && ms(o.expiresAt) > ms(now));
  const offerSlot = pending ? w.slots.find((s) => s.id === pending.slotId) : undefined;
  const offerPractice = offerSlot ? w.practices.find((p) => p.id === offerSlot.practiceId) : undefined;
  const referral = currentReferral(w, patientId) ?? null;
  const bookedSlot = referral?.slotId ? w.slots.find((s) => s.id === referral.slotId) : undefined;
  const bookedPractice = bookedSlot ? w.practices.find((p) => p.id === bookedSlot.practiceId) : undefined;
  const summary = referral?.summaryId ? w.summaries.find((s) => s.id === referral.summaryId) ?? null : null;
  const today = todayIn(now, timeZone);
  return {
    offer:
      pending && offerSlot && offerPractice
        ? { offer: pending, slot: offerSlot, practice: offerPractice, msLeft: ms(pending.expiresAt) - ms(now) }
        : null,
    referral,
    booked:
      bookedSlot && bookedPractice && (bookedSlot.status === "filled" || bookedSlot.status === "confirmed")
        ? { slot: bookedSlot, practice: bookedPractice, canConfirm: bookedSlot.status === "filled" && hoursUntil(now, bookedSlot.startsAt) <= CONFIRM_WINDOW_HOURS }
        : null,
    summary,
    checkedInToday: patient?.checkIns.some((c) => c.date === today) ?? false,
    streak: patient ? streak(patient.checkIns, today) : 0,
  };
}

export interface TrendLine {
  key: "mood" | "sleep" | "energy" | "skin";
  points: (number | null)[];
  average: number | null;
}

/** The last `days` calendar days of check-ins, oldest first, with gaps as null. Display only: no scoring. */
export function trends(checkIns: CheckIn[], today: string, days = 14): { dates: string[]; lines: TrendLine[] } {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) dates.push(new Date(new Date(`${today}T12:00:00Z`).getTime() - i * 86_400_000).toISOString().slice(0, 10));
  const byDate = new Map(checkIns.map((c) => [c.date, c]));
  const lines = (["mood", "sleep", "energy", "skin"] as const).map((key) => {
    const points: (number | null)[] = dates.map((d) => byDate.get(d)?.[key] ?? null);
    const vals = points.filter((p): p is number => p !== null);
    return { key, points, average: vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null };
  });
  return { dates, lines };
}

/** Which Patient Pack sections a recipient may open right now. */
export function packAccess(w: World, patientId: string, recipientId: string, sections: readonly SectionKey[]): Record<SectionKey, boolean> {
  const out = { story: false, trends: false, results: false, meds: false, insurance: false, summaries: false };
  for (const s of sections) out[s] = canSee(w, patientId, recipientId, s);
  return out;
}

/** The referral a practice is allowed to see: only once a patient accepted one of its slots. */
export function referralForSlot(w: World, slot: Slot): Referral | null {
  return slot.referralId ? w.referrals.find((r) => r.id === slot.referralId) ?? null : null;
}

export function feesByPayer(w: World): { practiceId: string; cents: number; count: number }[] {
  const totals = new Map<string, { cents: number; count: number }>();
  for (const l of w.ledger) {
    const t = totals.get(l.practiceId) ?? { cents: 0, count: 0 };
    totals.set(l.practiceId, { cents: t.cents + l.amountCents, count: t.count + 1 });
  }
  return [...totals].map(([practiceId, t]) => ({ practiceId, ...t }));
}
