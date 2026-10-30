import { referralRequirement } from "./coverage";
import type { AuditEvent, Channel, Command, Referral, Role, ShareKey, Specialist, Stage } from "./types";

export class DomainError extends Error {
  override name = "DomainError";
}

/** The patient-facing timeline. Terminal side exits (declined, withdrawn) are shown separately. */
export const TIMELINE: { stage: Stage; label: string; who: string; note: string }[] = [
  { stage: "draft", label: "Packet ready", who: "Attune agent", note: "Built from your tracker, portal notes, labs and uploads." },
  { stage: "awaiting_pcp", label: "You approved sharing", who: "You", note: "You chose the gyno and what gets shared." },
  { stage: "signed", label: "PCP signed off", who: "Your PCP's office", note: "The MA confirmed codes and signed the referral." },
  { stage: "sent", label: "Sent to the OB/GYN", who: "Attune agent", note: "Delivered with a receipt, the way their office receives referrals." },
  { stage: "offered", label: "Received by the OB/GYN", who: "OB/GYN front desk", note: "Accepted the referral and confirmed your time, or offered another." },
  { stage: "booked", label: "Visit booked", who: "You", note: "Booked. Your intake summary is already in their inbox." },
  { stage: "visited", label: "Visit done", who: "OB/GYN", note: "The visit happened and the outcome was recorded." },
  { stage: "closed", label: "PCP updated", who: "Attune agent", note: "Outcome sent back to your PCP; tracker plan updated." },
];

const ORDER: Stage[] = ["draft", "awaiting_pcp", "awaiting_physician", "signed", "sent", "offered", "booked", "visited", "closed"];

/** Position on the main path, used for "has this referral reached X yet" checks in every view. */
export function progress(stage: Stage): number {
  return ORDER.indexOf(stage);
}

export function reached(r: Referral, stage: Stage): boolean {
  const at = progress(r.stage);
  return at >= 0 && at >= progress(stage);
}

export function newReferral(init: {
  id: string;
  patientRef: string;
  fromPractice: string;
  plan: Referral["plan"];
  toSpecialty?: Referral["toSpecialty"];
  specialistId?: string | null;
  codes?: string[];
}): Referral {
  return {
    id: init.id,
    patientRef: init.patientRef,
    fromPractice: init.fromPractice,
    toSpecialty: init.toSpecialty ?? "OB/GYN",
    plan: init.plan,
    stage: "draft",
    specialistId: init.specialistId ?? null,
    share: { tracker: true, photos: true, portal: true, labs: true, uploads: true },
    waitlist: true,
    codes: init.codes ?? [],
    signatures: {},
    channel: null,
    requestedSlot: null,
    offeredSlot: null,
    bookedSlot: null,
    openRequests: [],
    outcome: null,
    note: null,
    consent: { grantedAt: null, revokedAt: null },
    log: [],
  };
}

function need(cond: boolean, message: string): asserts cond {
  if (!cond) throw new DomainError(message);
}

function actor(cmd: Command, ...allowed: Role[]) {
  need(allowed.includes(cmd.by), `${cmd.type} must be done by ${allowed.join(" or ")}, not ${cmd.by}.`);
}

function sharedKeys(r: Referral): ShareKey[] {
  return (Object.keys(r.share) as ShareKey[]).filter((k) => r.share[k]);
}

/**
 * Pick how the packet reaches the specialist: a FHIR endpoint if the office has one,
 * then Direct, then a verified fax. No verified route means the MA has to fix the directory first.
 */
export function chooseChannel(s: Pick<Specialist, "routes">): Channel {
  if (s.routes.fhir) return "fhir";
  if (s.routes.direct) return "direct";
  if (s.routes.fax?.verified) return "efax";
  throw new DomainError("No verified delivery route for this specialist. Verify a fax number or Direct address first.");
}

/**
 * Apply one command to a referral. Pure: returns a new referral with the event appended to its log,
 * or throws DomainError when the command is not allowed for this actor at this stage.
 */
export function apply(r: Referral, cmd: Command): Referral {
  const next = transition(r, cmd);
  const event: AuditEvent = {
    seq: r.log.length + 1,
    at: cmd.at,
    by: cmd.by,
    type: cmd.type,
    summary: summarize(next, cmd),
    ...(cmd.type === "deliver" ? { shared: sharedKeys(next) } : {}),
  };
  return { ...next, log: [...r.log, event] };
}

function transition(r: Referral, cmd: Command): Referral {
  switch (cmd.type) {
    case "chooseSpecialist":
      actor(cmd, "patient");
      need(r.stage === "draft", "The specialist can only change before you approve sharing.");
      // A held time belongs to one office; switching offices releases it.
      return { ...r, specialistId: cmd.specialistId, requestedSlot: cmd.specialistId === r.specialistId ? r.requestedSlot : null };

    case "holdSlot":
      actor(cmd, "patient");
      need(r.stage === "draft", "The time can only change before you approve sharing.");
      need(r.specialistId !== null, "Pick a specialist first.");
      return { ...r, requestedSlot: cmd.slot };

    case "toggleShare":
      actor(cmd, "patient");
      need(r.stage === "draft", "What gets shared can only change before you approve sharing.");
      return { ...r, share: { ...r.share, [cmd.key]: !r.share[cmd.key] } };

    case "setWaitlist":
      actor(cmd, "patient");
      need(!["closed", "declined", "withdrawn", "visited"].includes(r.stage), "The referral is finished.");
      return { ...r, waitlist: cmd.on };

    case "approveSharing":
      actor(cmd, "patient");
      need(r.stage === "draft", "Sharing is already approved.");
      need(r.specialistId !== null, "Pick a specialist first.");
      need(sharedKeys(r).length > 0, "Share at least one item, or the specialist gets an empty packet.");
      return { ...r, stage: "awaiting_pcp", consent: { grantedAt: cmd.at, revokedAt: null } };

    case "signReferral": {
      const req = referralRequirement(r.plan);
      need(cmd.codes.length > 0, "Confirm at least one ICD-10 code before signing.");
      if (r.stage === "awaiting_pcp") {
        actor(cmd, "pcp_ma", "pcp_physician");
        const signatures = cmd.by === "pcp_physician" ? { ma: r.signatures.ma, physician: cmd.signer } : { ma: cmd.signer };
        const done = !req.physicianSignature || cmd.by === "pcp_physician";
        return { ...r, codes: cmd.codes, signatures, stage: done ? "signed" : "awaiting_physician" };
      }
      need(r.stage === "awaiting_physician", "This referral is not waiting on a PCP signature.");
      actor(cmd, "pcp_physician");
      return { ...r, codes: cmd.codes, signatures: { ...r.signatures, physician: cmd.signer }, stage: "signed" };
    }

    case "deliver":
      actor(cmd, "agent");
      need(r.stage === "signed", "Nothing is sent before the PCP's office signs off.");
      need(r.consent.grantedAt !== null && r.consent.revokedAt === null, "The patient's sharing consent is not active.");
      return { ...r, stage: "sent", channel: cmd.channel };

    case "offerSlot":
      actor(cmd, "specialist_staff");
      need(r.stage === "sent", "A slot can be offered once the referral has arrived.");
      return { ...r, stage: "offered", offeredSlot: cmd.slot, openRequests: [] };

    case "confirmRequestedSlot":
      actor(cmd, "specialist_staff");
      need(r.stage === "sent", "A requested time can be confirmed once the referral has arrived.");
      need(r.requestedSlot !== null, "The patient didn't request a time. Offer one instead.");
      // The patient picked this time and approved the request, so confirming it books the visit.
      return { ...r, stage: "booked", offeredSlot: r.requestedSlot, bookedSlot: r.requestedSlot, openRequests: [] };

    case "requestRecords":
      actor(cmd, "specialist_staff");
      need(r.stage === "sent", "Records can be requested while the referral is in your inbox.");
      return { ...r, openRequests: [...r.openRequests, cmd.note] };

    case "declineReferral":
      actor(cmd, "specialist_staff");
      need(r.stage === "sent", "Only a referral in your inbox can be declined.");
      need(cmd.note.trim().length > 0, "Add a note so the PCP and patient know why.");
      return { ...r, stage: "declined", note: cmd.note };

    case "bookSlot":
      actor(cmd, "patient");
      need(r.stage === "offered" && r.offeredSlot !== null, "There is no slot to book yet.");
      return { ...r, stage: "booked", bookedSlot: r.offeredSlot };

    case "completeVisit":
      actor(cmd, "specialist_provider", "patient");
      need(r.stage === "booked", "The visit has to be booked first.");
      return { ...r, stage: "visited", outcome: cmd.outcome };

    case "closeLoop":
      actor(cmd, "agent");
      need(r.stage === "visited", "The loop closes after the visit.");
      return { ...r, stage: "closed" };

    case "revokeConsent": {
      actor(cmd, "patient");
      need(r.consent.grantedAt !== null && r.consent.revokedAt === null, "There is no active consent to revoke.");
      const consent = { ...r.consent, revokedAt: cmd.at };
      // Before anything left Attune, revoking pulls the request back to a draft.
      if (["awaiting_pcp", "awaiting_physician", "signed"].includes(r.stage)) {
        return { ...r, stage: "draft", signatures: {}, consent: { grantedAt: null, revokedAt: cmd.at } };
      }
      need(!["closed", "declined", "withdrawn"].includes(r.stage), "The referral is already finished.");
      // After sending, records already delivered stay with the office; nothing further is shared and the held time is released.
      return { ...r, stage: "withdrawn", consent, requestedSlot: null };
    }
  }
}

function summarize(r: Referral, cmd: Command): string {
  switch (cmd.type) {
    case "chooseSpecialist": return "Patient picked a specialist";
    case "toggleShare": return `Patient ${r.share[cmd.key] ? "added" : "removed"} ${cmd.key} from the packet`;
    case "setWaitlist": return cmd.on ? "Patient joined the cancellation waitlist" : "Patient left the cancellation waitlist";
    case "holdSlot": return `Patient picked ${cmd.slot.label} to request`;
    case "approveSharing": return "Patient approved sharing and sent the request to the PCP";
    case "signReferral": return r.stage === "awaiting_physician" ? `MA ${cmd.signer} signed; physician signature required by plan` : `${cmd.signer} signed the referral`;
    case "deliver": return `Packet delivered by ${cmd.channel === "efax" ? "e-fax" : cmd.channel === "direct" ? "Direct message (360X)" : "FHIR"} with receipt`;
    case "offerSlot": return `Specialist accepted and offered ${cmd.slot.label}`;
    case "confirmRequestedSlot": return `Specialist confirmed the patient's requested time, ${r.bookedSlot?.label ?? ""}`;
    case "requestRecords": return `Specialist requested more records: ${cmd.note}`;
    case "declineReferral": return `Specialist declined: ${cmd.note}`;
    case "bookSlot": return `Patient booked ${r.bookedSlot?.label ?? "the visit"}`;
    case "completeVisit": return "Visit completed and outcome recorded";
    case "closeLoop": return "Outcome sent back to the PCP";
    case "revokeConsent": return r.stage === "draft" ? "Patient withdrew consent before sending" : "Patient withdrew consent; no further sharing";
  }
}

export interface NextStep {
  role: Role;
  view: "patient" | "pcp" | "specialist" | null;
  label: string;
}

/** Who has to act next, and in which hosted view. Drives the "next in the loop" banner. */
export function nextStep(r: Referral): NextStep {
  switch (r.stage) {
    case "draft": return { role: "patient", view: "patient", label: "Patient approves sharing" };
    case "awaiting_pcp": return { role: "pcp_ma", view: "pcp", label: "PCP office signs off" };
    case "awaiting_physician": return { role: "pcp_physician", view: "pcp", label: "PCP physician co-signs" };
    case "signed": return { role: "agent", view: null, label: "Attune delivers the packet" };
    case "sent": return { role: "specialist_staff", view: "specialist", label: r.requestedSlot ? "Specialist confirms the requested time" : "Specialist accepts and offers a slot" };
    case "offered": return { role: "patient", view: "patient", label: "Patient books the visit" };
    case "booked": return { role: "specialist_provider", view: "specialist", label: "Specialist records the visit" };
    case "visited": return { role: "agent", view: null, label: "Attune closes the loop with the PCP" };
    case "closed":
    case "declined":
    case "withdrawn":
      return { role: "agent", view: null, label: "Loop finished" };
  }
}
