/**
 * Text that leaves the app (push, SMS, email). It never carries health details: no specialty, practice name,
 * condition, result or medication, and stays under 160 characters (one SMS). The patient opens Attune to see the
 * rest. test/notify.test.ts enforces both.
 */
import { PRODUCT_NAME } from "./config";
import type { Notice, World } from "./types";

export const PATIENT_TEXT = {
  offer: `A visit time opened up for you. Open ${PRODUCT_NAME} to see it before the hold ends.`,
  offerShared: `A visit time opened up. A few people got this too; first to accept gets it. Open ${PRODUCT_NAME} to see it.`,
  filledElsewhere: "That slot just filled. You're still on the list.",
  released: "The time we held for you was released. You're still on the list.",
  addInsurance: `One step left: add a photo of your insurance card in ${PRODUCT_NAME}.`,
  insuranceIssue: `We couldn't confirm your coverage. Open ${PRODUCT_NAME} to fix it.`,
  onWaitlist: "You're on the list. We'll tell you when a time opens.",
  booked: `You're booked. The details are in ${PRODUCT_NAME}.`,
  confirmTomorrow: `Your visit is coming up. Open ${PRODUCT_NAME} to confirm.`,
  summary: `Your visit summary is in ${PRODUCT_NAME}.`,
} as const;

export const PRACTICE_TEXT = {
  filled: (when: string) => `Your opening on ${when} was filled.`,
  unfilled: (when: string) => `Your opening on ${when} closed unfilled. Open ${PRODUCT_NAME} to see why.`,
  summaryIn: "A visit summary arrived for a patient you referred.",
  confirmed: (when: string) => `The patient for ${when} confirmed nothing has changed.`,
} as const;

export function notice(w: World, at: string, to: Notice["to"], text: string, channel: Notice["channel"] = "push"): Notice[] {
  return [...w.notices, { id: `n-${w.notices.length + 1}`, at, to, channel, text }];
}

/** Short, PHI-free label for a slot time, e.g. "Thu Nov 19, 2:40 PM". */
export function slotWhen(startsAt: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(startsAt));
}
