/**
 * Every change to the shared record is a command. `run` checks who may do it and when, applies it, writes one audit
 * event naming the actor and anything that left her record, then lets the agent settle follow-ups.
 */
import { settle } from "./agent";
import { applyAssistantCommand, type AssistantBody } from "./assistant";
import { ATTESTATION, CONFIRM_WINDOW_HOURS, MAX_HARDEST, PACK_SECTIONS } from "./config";
import { canSee, grant, newShareCode, normalizeCode, revoke } from "./consent";
import { SECTION_STAFF, SPECIALTY } from "./labels";
import { PATIENT_TEXT, PRACTICE_TEXT, notice, slotWhen } from "./notify";
import { hoursUntil, ms } from "./time";
import type {
  CheckIn, Clock, Referral, Requirement, Result, Role, SectionKey, Specialty, VisitMode, VisitSummary, WaitlistPrefs, World,
} from "./types";
import {
  DomainError, allow, audit, nameOf, need, offerOf, patientOf, practiceOf, referralOf, slotOf, withOffer, withPatient,
  withReferral, withSlot,
} from "./world";

type Body =
  | { type: "completeOnboarding"; patientId: string; hardest: string[]; helpWith: string[]; tried: string[] }
  | { type: "editStory"; patientId: string; words: string }
  | { type: "logCheckIn"; patientId: string; checkIn: CheckIn }
  | { type: "createShareCode"; patientId: string; sections: SectionKey[] }
  | { type: "setConsent"; patientId: string; recipientId: string; section: SectionKey; on: boolean }
  | { type: "captureInsuranceCard"; patientId: string; planId: string; memberIdLast4: string }
  | { type: "setPrefs"; patientId: string; prefs: WaitlistPrefs }
  | { type: "acceptOffer"; offerId: string }
  | { type: "declineOffer"; offerId: string }
  | { type: "confirmVisit"; slotId: string; update: string }
  | { type: "redeemShareCode"; code: string; dob: string; practiceId: string }
  | { type: "viewRecord"; patientId: string; recipientId: string; sections: SectionKey[] }
  | { type: "startReferral"; patientId: string; pcpId: string; specialty: Specialty }
  | { type: "signAndSend"; referralId: string; reason: string; urgent: boolean; attested: boolean; faxPracticeId: string | null }
  | { type: "attachResult"; referralId: string; result: Result }
  | { type: "setCriteria"; practiceId: string; criteria: Requirement[] }
  | { type: "postCancellation"; practiceId: string; provider: string; startsAt: string; minutes: number; mode: VisitMode }
  | { type: "withdrawSlot"; slotId: string }
  | { type: "markAttended"; slotId: string }
  | { type: "uploadSummary"; slotId: string; text: string; followUp: string; backToPcp: boolean }
  | { type: "verifyInsurance"; patientId: string }
  | { type: "flagInsurance"; patientId: string; issue: string }
  | { type: "simulateReply"; offerId: string; accept: boolean }
  | { type: "setClock"; clock: Partial<Pick<Clock, "speed" | "offsetMs">> & { paused?: boolean } };

export type Command = (Body | AssistantBody) & { by: Role; who: string };
export type CommandType = Command["type"];

const PCP: Role[] = ["pcp_ma", "pcp_physician"];
const SPECIALIST: Role[] = ["specialist_staff", "specialist_provider"];
const VIEW_DEDUPE_MS = 10 * 60_000;

/** Apply one command and settle. Throws DomainError when the rules refuse it. */
export function run(w: World, cmd: Command, now: string): World {
  return settle(apply(w, cmd, now), now);
}

function apply(w: World, c: Command, now: string): World {
  const log = (next: World, summary: string, patientId: string | null, shared?: { recipientId: string; sections: SectionKey[] }) =>
    audit(next, { at: now, by: c.by, who: c.who, type: c.type, summary, patientId, ...(shared ? { shared } : {}) });

  switch (c.type) {
    case "completeOnboarding": {
      allow(c.by, ["patient"], "Onboarding");
      need(c.hardest.length > 0 && c.hardest.length <= MAX_HARDEST, `Pick between one and ${MAX_HARDEST} things.`);
      const p = patientOf(w, c.patientId);
      const story = { hardest: c.hardest, helpWith: c.helpWith, tried: c.tried, words: p.story?.words ?? "" };
      return log(withPatient(w, p.id, { story, onboardedAt: p.onboardedAt ?? now }), "Patient finished onboarding; her record starts here", p.id);
    }

    case "editStory": {
      allow(c.by, ["patient"], "Editing her story");
      const p = patientOf(w, c.patientId);
      need(p.story, "Finish onboarding first.");
      return log(withPatient(w, p.id, { story: { ...p.story, words: c.words.trim() } }), "Patient updated her story", p.id);
    }

    case "logCheckIn": {
      allow(c.by, ["patient"], "A check-in");
      const p = patientOf(w, c.patientId);
      const checkIns = [...p.checkIns.filter((x) => x.date !== c.checkIn.date), c.checkIn].sort((a, b) => a.date.localeCompare(b.date));
      return log(withPatient(w, p.id, { checkIns }), `Patient checked in for ${c.checkIn.date}`, p.id);
    }

    case "createShareCode": {
      allow(c.by, ["patient"], "Sharing");
      need(c.sections.length > 0, "Pick at least one part of your record to share.");
      const code = newShareCode(w, c.patientId, c.sections, now);
      return log({ ...w, shareCodes: [...w.shareCodes, code] }, `Patient created share code ${code.code} for ${c.sections.length} sections`, c.patientId);
    }

    case "redeemShareCode": {
      allow(c.by, PCP, "Opening a shared record");
      const code = w.shareCodes.find((s) => s.code === normalizeCode(c.code));
      need(code, "That code doesn't match. Ask the patient to read it again.");
      need(code.redeemedBy === null, "That code was already used. Ask the patient for a new one.");
      need(ms(now) < ms(code.expiresAt), "That code expired. Ask the patient for a new one.");
      need(patientOf(w, code.patientId).dob === c.dob, "The date of birth doesn't match this code.");
      const g = grant(w, code.patientId, c.practiceId, code.sections, now, "share_code");
      const shareCodes = w.shareCodes.map((s) => (s.code === code.code ? { ...s, redeemedBy: c.practiceId, redeemedAt: now } : s));
      return log({ ...w, consents: g.consents, shareCodes }, `${nameOf(w, c.practiceId)} opened the shared record with code ${code.code}`, code.patientId, {
        recipientId: c.practiceId,
        sections: code.sections,
      });
    }

    case "setConsent": {
      allow(c.by, ["patient"], "Changing who sees your record");
      const had = w.consents.some((x) => x.patientId === c.patientId && x.recipientId === c.recipientId);
      need(had, "You can only change sharing for someone you already share with.");
      const label = SECTION_STAFF[c.section].toLowerCase();
      if (c.on) {
        const g = grant(w, c.patientId, c.recipientId, [c.section], now, "patient");
        if (g.added.length === 0) return w;
        return log({ ...w, consents: g.consents }, `Patient shared ${label} with ${nameOf(w, c.recipientId)}`, c.patientId, {
          recipientId: c.recipientId,
          sections: [c.section],
        });
      }
      if (!canSee(w, c.patientId, c.recipientId, c.section)) return w;
      return log({ ...w, consents: revoke(w, c.patientId, c.recipientId, c.section, now) }, `Patient stopped sharing ${label} with ${nameOf(w, c.recipientId)}`, c.patientId);
    }

    case "viewRecord": {
      allow(c.by, [...PCP, ...SPECIALIST, "assistant"], "Viewing a record");
      const blocked = c.sections.filter((s) => !canSee(w, c.patientId, c.recipientId, s));
      need(blocked.length === 0, `The patient hasn't shared ${blocked.map((s) => SECTION_STAFF[s].toLowerCase()).join(", ")} with you.`);
      const recent = w.views.some(
        (v) => v.patientId === c.patientId && v.recipientId === c.recipientId && v.viewer === c.who && ms(now) - ms(v.at) < VIEW_DEDUPE_MS,
      );
      if (recent || c.sections.length === 0) return w;
      const views = [...w.views, { at: now, patientId: c.patientId, recipientId: c.recipientId, viewer: c.who, sections: c.sections }];
      return log({ ...w, views }, `${c.who} at ${nameOf(w, c.recipientId)} viewed the record`, c.patientId, { recipientId: c.recipientId, sections: c.sections });
    }

    case "captureInsuranceCard": {
      allow(c.by, ["patient"], "Adding an insurance card");
      need(w.plans.some((p) => p.id === c.planId), "Pick the plan shown on your card.");
      need(/^\d{4}$/.test(c.memberIdLast4), "Enter the last four digits of your member ID.");
      const insurance = { planId: c.planId, memberIdLast4: c.memberIdLast4, cardCapturedAt: now, verifiedAt: null, issue: null };
      return log(withPatient(w, c.patientId, { insurance }), "Patient added a photo of her insurance card; check requested", c.patientId);
    }

    case "setPrefs": {
      allow(c.by, ["patient"], "Waitlist preferences");
      const p = c.prefs;
      need(p.days.length > 0, "Pick at least one day.");
      need(p.times.length > 0, "Pick at least one time of day.");
      need(p.maxMiles > 0 || p.telehealth, "Allow some distance, or say yes to telehealth.");
      need(p.minNoticeHours >= 0, "Notice can't be negative.");
      return log(withPatient(w, c.patientId, { prefs: p }), p.paused ? "Patient paused her waitlist" : "Patient updated her waitlist preferences", c.patientId);
    }

    case "acceptOffer":
    case "declineOffer":
      allow(c.by, ["patient"], "Answering an offer");
      return answer(w, c.offerId, c.type === "acceptOffer", now, log);

    case "simulateReply": {
      allow(c.by, ["ops"], "Simulating a reply");
      const o = offerOf(w, c.offerId);
      need(!patientOf(w, o.patientId).hasApp, "Only synthetic patients without the app can be simulated.");
      return answer(w, c.offerId, c.accept, now, (next, summary, pid, shared) => log(next, `Simulated: ${summary}`, pid, shared));
    }

    case "confirmVisit": {
      allow(c.by, ["patient"], "Confirming a visit");
      const slot = slotOf(w, c.slotId);
      need(slot.status === "filled" || slot.status === "confirmed", "This visit isn't booked.");
      need(hoursUntil(now, slot.startsAt) <= CONFIRM_WINDOW_HOURS, `You can confirm in the ${CONFIRM_WINDOW_HOURS} hours before your visit.`);
      need(slot.referralId, "This visit isn't booked.");
      const r = referralOf(w, slot.referralId);
      const update = c.update.trim() || null;
      let next = withSlot(w, slot.id, { status: "confirmed" });
      next = withReferral(next, r.id, { patientUpdate: update });
      const when = slotWhen(slot.startsAt, practiceOf(w, slot.practiceId).timeZone);
      next = { ...next, notices: notice(next, now, { kind: "practice", id: slot.practiceId }, PRACTICE_TEXT.confirmed(when), "in_app") };
      return log(next, update ? "Patient confirmed the visit and noted a change" : "Patient confirmed nothing has changed", r.patientId);
    }

    case "startReferral": {
      allow(c.by, PCP, "Starting a referral");
      const p = patientOf(w, c.patientId);
      need(p.pcpId === c.pcpId, "This patient isn't with your practice.");
      need(w.consents.some((x) => x.patientId === p.id && x.recipientId === c.pcpId && x.revokedAt === null), "Open her shared record first.");
      need(!w.referrals.some((r) => r.patientId === p.id && r.specialty === c.specialty && r.status !== "closed"), `She already has an open ${SPECIALTY[c.specialty].label.toLowerCase()} referral.`);
      const r: Referral = {
        id: `r-${w.referrals.length + 1}`, patientId: p.id, pcpId: c.pcpId, specialty: c.specialty, reason: "", urgent: false,
        status: "draft", createdAt: now, preparedBy: c.who, signature: null, missing: [], waitlistSince: null,
        slotId: null, summaryId: null, route: "attune", faxPracticeId: null, patientUpdate: null,
      };
      return log({ ...w, referrals: [...w.referrals, r] }, `Draft ${SPECIALTY[c.specialty].label.toLowerCase()} referral started`, p.id);
    }

    case "signAndSend": {
      allow(c.by, ["pcp_physician"], "Signing a referral");
      const r = referralOf(w, c.referralId);
      need(r.status === "draft", "This referral was already sent.");
      need(c.reason.trim().length >= 10, "Write the reason for referral (a sentence or two).");
      need(c.attested, "Confirm that you evaluated this patient before signing.");
      const signature = { signer: c.who, role: c.by, attestation: ATTESTATION, at: now };
      if (c.faxPracticeId) {
        const target = practiceOf(w, c.faxPracticeId);
        need(!target.onAttune && target.specialty === r.specialty, "Fax fallback is for practices not on Attune in this specialty.");
        need(target.routes.direct || target.routes.fax?.verified, "That practice has no verified fax or Direct address.");
      }
      const next = withReferral(w, r.id, {
        reason: c.reason.trim(), urgent: c.urgent, signature, status: "sent",
        route: c.faxPracticeId ? "fax" : "attune", faxPracticeId: c.faxPracticeId,
      });
      return log(next, c.faxPracticeId
        ? `Signed; packet prepared for ${nameOf(w, c.faxPracticeId)} by ${practiceOf(w, c.faxPracticeId).routes.direct ? "Direct" : "fax"} (prototype: not transmitted)`
        : `Signed and sent${c.urgent ? ", flagged urgent" : ""}`, r.patientId);
    }

    case "attachResult": {
      allow(c.by, PCP, "Attaching a result");
      const r = referralOf(w, c.referralId);
      need(!["offered", "booked", "seen", "summary_received", "closed"].includes(r.status), "Results can't be added once a visit is offered or booked.");
      const p = patientOf(w, r.patientId);
      const dup = p.results.some((x) => x.name === c.result.name && x.collectedOn === c.result.collectedOn);
      let next = dup ? w : withPatient(w, p.id, { results: [...p.results, c.result] });
      if (r.status === "needs_info") next = withReferral(next, r.id, { status: "sent" });
      if (next === w) return w;
      return log(next, `PCP office attached ${c.result.name} (${c.result.collectedOn}) to her record`, r.patientId);
    }

    case "setCriteria": {
      allow(c.by, SPECIALIST, "Publishing criteria");
      const p = practiceOf(w, c.practiceId);
      need(p.kind === "specialist" && p.onAttune, "Only specialist practices on Attune publish criteria.");
      return log({ ...w, practices: w.practices.map((x) => (x.id === p.id ? { ...x, criteria: c.criteria } : x)) }, `${p.name} published ${c.criteria.length} acceptance criteria`, null);
    }

    case "postCancellation": {
      allow(c.by, SPECIALIST, "Posting a cancellation");
      const p = practiceOf(w, c.practiceId);
      need(p.kind === "specialist" && p.onAttune && p.specialty, "Only specialist practices on Attune post openings.");
      need(p.providers.includes(c.provider), "Pick one of your providers.");
      need(ms(c.startsAt) > ms(now), "Pick a time in the future.");
      need(c.minutes >= 15 && c.minutes <= 120, "Visit length must be 15 to 120 minutes.");
      const slot = {
        id: `s-${w.slots.length + 1}`, practiceId: p.id, provider: c.provider, specialty: p.specialty, startsAt: c.startsAt,
        minutes: c.minutes, mode: c.mode, status: "open" as const, postedAt: now, postedBy: c.who, rounds: 0,
        referralId: null, unfilledReason: null, reminderSent: false,
      };
      return log({ ...w, slots: [...w.slots, slot] }, `${p.name} posted a cancellation (${slot.id})`, null);
    }

    case "withdrawSlot": {
      allow(c.by, SPECIALIST, "Withdrawing an opening");
      const slot = slotOf(w, c.slotId);
      need(slot.status === "open" || slot.status === "offering", "Booked visits are cancelled by calling the patient, not withdrawn here.");
      let next = withSlot(w, slot.id, { status: "withdrawn" });
      for (const o of w.offers.filter((x) => x.slotId === slot.id && x.status === "pending")) {
        next = withOffer(next, o.id, { status: "superseded", respondedAt: now });
        next = withReferral(next, o.referralId, { status: "on_waitlist" });
      }
      return log(next, `Opening ${slot.id} withdrawn by the practice`, null);
    }

    case "markAttended": {
      allow(c.by, SPECIALIST, "Marking a visit attended");
      const slot = slotOf(w, c.slotId);
      need(slot.status === "filled" || slot.status === "confirmed", "Only a booked visit can be marked attended.");
      need(ms(now) >= ms(slot.startsAt), "The visit hasn't started yet.");
      need(slot.referralId, "No patient is booked.");
      const r = referralOf(w, slot.referralId);
      let next = withSlot(w, slot.id, { status: "completed" });
      next = withReferral(next, r.id, { status: "seen" });
      next = accrue(next, slot.practiceId, r.id, slot.id, "visit_attended", now);
      return log(next, "Visit attended", r.patientId);
    }

    case "uploadSummary": {
      allow(c.by, SPECIALIST, "Uploading a visit summary");
      const slot = slotOf(w, c.slotId);
      need(slot.status === "completed" && slot.referralId, "Mark the visit attended first.");
      need(c.text.trim().length >= 20, "Write the summary (a few sentences).");
      const r = referralOf(w, slot.referralId);
      need(r.status === "seen", "A summary was already sent for this visit.");
      const summary: VisitSummary = {
        id: `v-${w.summaries.length + 1}`, referralId: r.id, slotId: slot.id, practiceId: slot.practiceId, author: c.who, at: now,
        text: c.text.trim(), followUp: c.followUp.trim(), backToPcp: c.backToPcp,
      };
      const next = withReferral({ ...w, summaries: [...w.summaries, summary] }, r.id, { status: "summary_received", summaryId: summary.id });
      return log(next, `${nameOf(w, slot.practiceId)} uploaded a visit summary`, r.patientId);
    }

    case "verifyInsurance": {
      allow(c.by, ["ops"], "Verifying insurance");
      const p = patientOf(w, c.patientId);
      need(p.insurance?.cardCapturedAt, "There's no card on file to check.");
      return log(withPatient(w, p.id, { insurance: { ...p.insurance, verifiedAt: now, issue: null } }), "Insurance eligibility verified", p.id);
    }

    case "flagInsurance": {
      allow(c.by, ["ops"], "Flagging insurance");
      const p = patientOf(w, c.patientId);
      need(p.insurance, "There's no card on file to flag.");
      need(c.issue.trim(), "Say what's wrong so she can fix it.");
      return log(withPatient(w, p.id, { insurance: { ...p.insurance, issue: c.issue.trim(), verifiedAt: null } }), "Insurance check flagged an issue", p.id);
    }

    case "setClock":
      allow(c.by, ["ops"], "Changing the demo clock");
      return setClock(w, c.clock, now, log);

    case "connectAssistant":
    case "disconnectAssistant":
    case "writeJournal":
    case "suggestUpdates":
    case "applyProposal":
    case "dismissProposal":
      return applyAssistantCommand(w, c, now, log);
  }
}

type Log = (next: World, summary: string, patientId: string | null, shared?: { recipientId: string; sections: SectionKey[] }) => World;

/** First to accept wins. Accepting is her consent to share the Patient Pack with that practice, and nothing before. */
function answer(w: World, offerId: string, accept: boolean, now: string, log: Log): World {
  const o = offerOf(w, offerId);
  const slot = slotOf(w, o.slotId);
  if (o.status === "superseded") throw new DomainError(PATIENT_TEXT.filledElsewhere);
  need(o.status === "pending", "This offer has already ended.");
  need(ms(now) < ms(o.expiresAt), "The hold ended. You're still on the list.");
  need(slot.status === "offering", PATIENT_TEXT.filledElsewhere);

  if (!accept) {
    let next = withOffer(w, o.id, { status: "declined", respondedAt: now });
    next = withReferral(next, o.referralId, { status: "on_waitlist" });
    return log(next, `Patient declined offer ${o.id}; still on the waitlist`, o.patientId);
  }

  let next = withOffer(w, o.id, { status: "accepted", respondedAt: now });
  for (const other of w.offers.filter((x) => x.slotId === slot.id && x.status === "pending" && x.id !== o.id)) {
    next = withOffer(next, other.id, { status: "superseded", respondedAt: now });
    next = withReferral(next, other.referralId, { status: "on_waitlist" });
    next = { ...next, notices: notice(next, now, { kind: "patient", id: other.patientId }, PATIENT_TEXT.filledElsewhere) };
  }
  next = withSlot(next, slot.id, { status: "filled", referralId: o.referralId });
  next = withReferral(next, o.referralId, { status: "booked", slotId: slot.id });
  const g = grant(next, o.patientId, slot.practiceId, PACK_SECTIONS, now, "offer");
  next = { ...next, consents: g.consents };
  next = accrue(next, slot.practiceId, o.referralId, slot.id, "booked", now);
  const when = slotWhen(slot.startsAt, practiceOf(w, slot.practiceId).timeZone);
  next = { ...next, notices: notice(next, now, { kind: "practice", id: slot.practiceId }, PRACTICE_TEXT.filled(when), "in_app") };
  next = { ...next, notices: notice(next, now, { kind: "patient", id: o.patientId }, PATIENT_TEXT.booked) };
  return log(next, `Patient accepted offer ${o.id}; booked and shared her Patient Pack with ${nameOf(w, slot.practiceId)}`, o.patientId, {
    recipientId: slot.practiceId,
    sections: [...PACK_SECTIONS],
  });
}

/** Fees accrue to the specialist practice only, once per referral, on the trigger in its terms. Nothing is billed. */
function accrue(w: World, practiceId: string, referralId: string, slotId: string, trigger: "visit_attended" | "booked", now: string): World {
  const terms = w.feeTerms[practiceId];
  if (!terms || terms.trigger !== trigger || w.ledger.some((l) => l.referralId === referralId)) return w;
  const entry = { id: `f-${w.ledger.length + 1}`, practiceId, referralId, slotId, amountCents: terms.amountCents, trigger, accruedAt: now, billed: false as const };
  return { ...w, ledger: [...w.ledger, entry] };
}

function setClock(w: World, change: Partial<Pick<Clock, "speed" | "offsetMs">> & { paused?: boolean }, now: string, log: Log): World {
  let clock = { ...w.clock };
  let offers = w.offers;
  if (change.speed !== undefined) {
    need(change.speed >= 1, "Speed must be at least 1.");
    clock.speed = change.speed;
  }
  if (change.offsetMs !== undefined) clock.offsetMs = change.offsetMs;
  if (change.paused === true && !clock.pausedAt) clock.pausedAt = now;
  if (change.paused === false && clock.pausedAt) {
    const pausedFor = ms(now) - ms(clock.pausedAt);
    offers = offers.map((o) => (o.status === "pending" ? { ...o, expiresAt: new Date(ms(o.expiresAt) + pausedFor).toISOString() } : o));
    clock = { ...clock, pausedAt: null };
  }
  const parts = [
    change.speed !== undefined ? `speed ${clock.speed}x` : null,
    change.paused !== undefined ? (change.paused ? "timers paused" : "timers resumed") : null,
    change.offsetMs !== undefined ? `clock offset ${Math.round(clock.offsetMs / 3_600_000)} h` : null,
  ].filter(Boolean);
  return log({ ...w, clock, offers }, `Demo clock: ${parts.join(", ")}`, null);
}
