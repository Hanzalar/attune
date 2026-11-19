/** Lookups and small immutable updates over the shared world. Refusals throw DomainError with an actionable message. */
import { AI_ASSISTANTS, LOCAL_ASSISTANT } from "./config";
import type { AuditEvent, Offer, Patient, Practice, Referral, Role, SectionKey, Slot, World } from "./types";

export class DomainError extends Error {
  override name = "DomainError";
}

export function need(cond: unknown, message: string): asserts cond {
  if (!cond) throw new DomainError(message);
}

export function allow(by: Role, allowed: Role[], what: string): void {
  need(allowed.includes(by), `${what} is done by ${allowed.join(" or ")}, not ${by}.`);
}

function find<T extends { id: string }>(list: T[], id: string, what: string): T {
  const item = list.find((x) => x.id === id);
  need(item, `${what} ${id} was not found.`);
  return item;
}

export const patientOf = (w: World, id: string): Patient => find(w.patients, id, "Patient");
export const practiceOf = (w: World, id: string): Practice => find(w.practices, id, "Practice");
export const referralOf = (w: World, id: string): Referral => find(w.referrals, id, "Referral");
export const slotOf = (w: World, id: string): Slot => find(w.slots, id, "Slot");
export const offerOf = (w: World, id: string): Offer => find(w.offers, id, "Offer");

export function replace<T extends { id: string }>(list: T[], id: string, patch: Partial<T>): T[] {
  return list.map((x) => (x.id === id ? { ...x, ...patch } : x));
}

export function withPatient(w: World, id: string, patch: Partial<Patient>): World {
  return { ...w, patients: replace(w.patients, id, patch) };
}

export function withReferral(w: World, id: string, patch: Partial<Referral>): World {
  return { ...w, referrals: replace(w.referrals, id, patch) };
}

export function withSlot(w: World, id: string, patch: Partial<Slot>): World {
  return { ...w, slots: replace(w.slots, id, patch) };
}

export function withOffer(w: World, id: string, patch: Partial<Offer>): World {
  return { ...w, offers: replace(w.offers, id, patch) };
}

/** Append-only audit log. Nothing in the domain edits or removes an event. */
export function audit(
  w: World,
  e: { at: string; by: Role; who: string; type: string; summary: string; patientId: string | null; shared?: { recipientId: string; sections: SectionKey[] } },
): World {
  const event: AuditEvent = { seq: w.log.length + 1, ...e };
  return { ...w, log: [...w.log, event] };
}

/** A recipient's display name: a practice, or an AI assistant she connected. */
export function nameOf(w: World, recipientId: string): string {
  const assistant = [...AI_ASSISTANTS, LOCAL_ASSISTANT].find((a) => a.id === recipientId);
  return w.practices.find((p) => p.id === recipientId)?.name ?? (assistant ? `${assistant.name} (${assistant.vendor})` : recipientId);
}

/** Her referral that is still moving, newest first; falls back to the newest closed one. */
export function currentReferral(w: World, patientId: string): Referral | undefined {
  const mine = w.referrals.filter((r) => r.patientId === patientId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return mine.find((r) => r.status !== "closed") ?? mine[0];
}
