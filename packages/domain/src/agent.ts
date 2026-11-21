/**
 * What Attune does on its own once a person has acted: check completeness, ask for insurance, put her on the
 * waitlist, send and expire offers, close unfilled slots, and deliver visit summaries. Each step is one small rule;
 * `settle` runs them until nothing changes, so it is safe to call on every clock tick.
 */
import { CONFIRM_WINDOW_HOURS, INSURANCE_FRESH_HOURS } from "./config";
import { canSee } from "./consent";
import { checkAcrossSpecialty } from "./criteria";
import { describeSkips, holdMs, holdRule, matchSlot } from "./matching";
import { PATIENT_TEXT, PRACTICE_TEXT, notice, slotWhen } from "./notify";
import { addMs, hoursUntil, ms } from "./time";
import type { Offer, Referral, Slot, World } from "./types";
import { audit, nameOf, patientOf, practiceOf, withOffer, withReferral, withSlot } from "./world";

const AGENT = { by: "agent" as const, who: "Attune" };

function insuranceReady(w: World, referral: Referral, now: string): "ready" | "issue" | "missing" | "stale" {
  const ins = patientOf(w, referral.patientId).insurance;
  if (!ins || !ins.cardCapturedAt) return "missing";
  if (ins.issue) return "issue";
  if (!ins.verifiedAt || hoursUntil(ins.verifiedAt, now) > INSURANCE_FRESH_HOURS) return "stale";
  return "ready";
}

function joinWaitlist(w: World, r: Referral, now: string): World {
  let next = withReferral(w, r.id, { status: "on_waitlist", waitlistSince: r.waitlistSince ?? now });
  next = audit(next, { at: now, ...AGENT, type: "joinWaitlist", summary: "Insurance verified; patient joined the waitlist", patientId: r.patientId });
  return { ...next, notices: notice(next, now, { kind: "patient", id: r.patientId }, PATIENT_TEXT.onWaitlist) };
}

/** Sent → qualified or needs info, against every practice on Attune in the specialty. */
function qualify(w: World, now: string): World | null {
  const r = w.referrals.find((x) => x.status === "sent" && x.route === "attune");
  if (!r) return null;
  const check = checkAcrossSpecialty(w.practices, patientOf(w, r.patientId), r, now);
  const done = check.results.filter((c) => c.complete).length;
  const next = withReferral(w, r.id, { status: check.qualified ? "qualified" : "needs_info", missing: check.missing });
  return audit(next, {
    at: now,
    ...AGENT,
    type: check.qualified ? "qualify" : "needsInfo",
    summary: check.qualified
      ? `Referral complete for ${done} of ${check.results.length} practices' criteria`
      : `Referral incomplete for every practice: ${check.missing.join("; ")}`,
    patientId: r.patientId,
  });
}

/** Qualified or waiting on insurance → waitlist, or a clear ask for the card. */
function insuranceStep(w: World, now: string): World | null {
  for (const r of w.referrals) {
    if (!["qualified", "insurance_pending", "insurance_issue"].includes(r.status)) continue;
    const state = insuranceReady(w, r, now);
    if (state === "ready") return joinWaitlist(w, r, now);
    const target = state === "issue" ? "insurance_issue" : "insurance_pending";
    if (r.status === target) continue;
    let next = withReferral(w, r.id, { status: target });
    next = audit(next, {
      at: now,
      ...AGENT,
      type: target === "insurance_issue" ? "insuranceIssue" : "requestInsurance",
      summary: target === "insurance_issue" ? "Insurance check found a problem; patient asked to fix it" : "Waiting on an insurance check",
      patientId: r.patientId,
    });
    const text = target === "insurance_issue" ? PATIENT_TEXT.insuranceIssue : state === "missing" ? PATIENT_TEXT.addInsurance : null;
    return text ? { ...next, notices: notice(next, now, { kind: "patient", id: r.patientId }, text) } : next;
  }
  return null;
}

function releaseOffer(w: World, o: Offer, status: "expired" | "superseded", now: string): World {
  let next = withOffer(w, o.id, { status, respondedAt: now });
  const r = next.referrals.find((x) => x.id === o.referralId);
  if (r?.status === "offered") next = withReferral(next, r.id, { status: "on_waitlist" });
  const text = status === "expired" ? PATIENT_TEXT.released : PATIENT_TEXT.filledElsewhere;
  return { ...next, notices: notice(next, now, { kind: "patient", id: o.patientId }, text) };
}

/** Holds that ran out. Paused demo clocks stop expiry. */
function expireOffers(w: World, now: string): World | null {
  if (w.clock.pausedAt) return null;
  const o = w.offers.find((x) => x.status === "pending" && ms(x.expiresAt) <= ms(now));
  if (!o) return null;
  const next = releaseOffer(w, o, "expired", now);
  return audit(next, { at: now, ...AGENT, type: "expireOffer", summary: `Hold ended without a reply (offer ${o.id})`, patientId: o.patientId });
}

function closeUnfilled(w: World, slot: Slot, reason: string, now: string): World {
  let next = w;
  for (const o of w.offers.filter((x) => x.slotId === slot.id && x.status === "pending")) next = releaseOffer(next, o, "expired", now);
  next = withSlot(next, slot.id, { status: "unfilled", unfilledReason: reason });
  next = audit(next, { at: now, ...AGENT, type: "closeUnfilled", summary: `Slot ${slot.id} closed unfilled: ${reason}`, patientId: null });
  const when = slotWhen(slot.startsAt, practiceOf(w, slot.practiceId).timeZone);
  return { ...next, notices: notice(next, now, { kind: "practice", id: slot.practiceId }, PRACTICE_TEXT.unfilled(when), "in_app") };
}

/** Send the next round, or close the slot with a reason the practice can read. */
function offerRound(w: World, now: string): World | null {
  for (const slot of w.slots) {
    if (slot.status !== "open" && slot.status !== "offering") continue;
    if (ms(slot.startsAt) <= ms(now)) return closeUnfilled(w, slot, "The start time passed before anyone accepted.", now);
    if (w.offers.some((o) => o.slotId === slot.id && o.status === "pending")) continue;

    const match = matchSlot(w, slot, now);
    const rule = holdRule(slot.startsAt, now);
    const picked = match.eligible.slice(0, rule.batch);
    if (picked.length === 0) {
      const sent = w.offers.filter((o) => o.slotId === slot.id).length;
      const reason = sent === 0 ? describeSkips(match) : `Offered to ${sent} ${sent === 1 ? "patient" : "patients"}; none accepted in time and nobody else matched.`;
      return closeUnfilled(w, slot, reason, now);
    }

    const expiresAt = addMs(now, holdMs(slot.startsAt, now, w.clock.speed));
    let next: World = withSlot(w, slot.id, { status: "offering", rounds: slot.rounds + 1 });
    for (const c of picked) {
      const offer: Offer = {
        id: `o-${next.offers.length + 1}`,
        slotId: slot.id,
        referralId: c.referralId,
        patientId: c.patientId,
        round: slot.rounds + 1,
        sentAt: now,
        expiresAt,
        status: "pending",
        respondedAt: null,
      };
      next = { ...next, offers: [...next.offers, offer] };
      next = withReferral(next, c.referralId, { status: "offered" });
      const text = picked.length > 1 ? PATIENT_TEXT.offerShared : PATIENT_TEXT.offer;
      next = { ...next, notices: notice(next, now, { kind: "patient", id: c.patientId }, text) };
    }
    return audit(next, {
      at: now,
      ...AGENT,
      type: "sendOffers",
      summary: `Round ${slot.rounds + 1} for slot ${slot.id}: offered to ${picked.length} (${rule.label}: ${rule.holdMinutes}-minute hold, up to ${rule.batch} at once)`,
      patientId: null,
    });
  }
  return null;
}

/** Ask her to confirm once the visit is inside the confirmation window. */
function remind(w: World, now: string): World | null {
  const slot = w.slots.find(
    (s) => s.status === "filled" && !s.reminderSent && s.referralId && hoursUntil(now, s.startsAt) <= CONFIRM_WINDOW_HOURS,
  );
  if (!slot?.referralId) return null;
  const patientId = w.referrals.find((r) => r.id === slot.referralId)?.patientId;
  if (!patientId) return null;
  const next = withSlot(w, slot.id, { reminderSent: true });
  return { ...next, notices: notice(next, now, { kind: "patient", id: patientId }, PATIENT_TEXT.confirmTomorrow) };
}

/** Summary → her record and, if she still shares summaries with them, the PCP's inbox. Then the referral closes. */
function deliverSummary(w: World, now: string): World | null {
  const r = w.referrals.find((x) => x.status === "summary_received");
  if (!r) return null;
  const toPcp = canSee(w, r.patientId, r.pcpId, "summaries");
  let next = withReferral(w, r.id, { status: "closed" });
  next = { ...next, notices: notice(next, now, { kind: "patient", id: r.patientId }, PATIENT_TEXT.summary) };
  if (toPcp) next = { ...next, notices: notice(next, now, { kind: "practice", id: r.pcpId }, PRACTICE_TEXT.summaryIn, "in_app") };
  return audit(next, {
    at: now,
    ...AGENT,
    type: "closeLoop",
    summary: toPcp
      ? `Visit summary filed to the patient's record and sent to ${nameOf(w, r.pcpId)}; referral closed`
      : `Visit summary filed to the patient's record; not sent to ${nameOf(w, r.pcpId)} because she stopped sharing summaries with them; referral closed`,
    patientId: r.patientId,
    ...(toPcp ? { shared: { recipientId: r.pcpId, sections: ["summaries" as const] } } : {}),
  });
}

const STEPS = [qualify, insuranceStep, expireOffers, offerRound, remind, deliverSummary];

/** Run agent steps until none applies. Returns the same object when nothing changed, so callers can skip a publish. */
export function settle(w: World, now: string): World {
  let current = w;
  for (let guard = 0; guard < 200; guard++) {
    let changed = false;
    for (const step of STEPS) {
      const next = step(current, now);
      if (next) {
        current = next;
        changed = true;
        break;
      }
    }
    if (!changed) return current;
  }
  throw new Error("settle did not converge; an agent step keeps changing state.");
}
