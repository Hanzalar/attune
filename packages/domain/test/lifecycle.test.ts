import { describe, expect, it } from "vitest";
import {
  DEMO_IDS, DomainError, PACK_SECTIONS, canSee, demoChart, demoWorld, run, settle, type Command, type World,
} from "../src";
import { NOW, THU_AFTERNOON, ari, fill, later, pendingFor, post, who } from "./helpers";

const go = (w: World, cmd: Command, at = NOW) => run(w, cmd, at);
const refuses = (w: World, cmd: Command, msg: RegExp, at = NOW) => {
  expect(() => run(w, cmd, at)).toThrow(DomainError);
  expect(() => run(w, cmd, at)).toThrow(msg);
};
const ariReferral = (w: World) => w.referrals.filter((r) => r.patientId === ari).at(-1)!;

describe("the referral loop from a fresh install", () => {
  it("walks onboarding, sharing, referral, insurance, waitlist, offer, visit, summary and close", () => {
    let w = demoWorld(NOW, "fresh");
    w = go(w, { ...who.patient, type: "completeOnboarding", patientId: ari, hardest: ["Sleep", "Mood"], helpWith: ["Not retelling my story"], tried: ["Birth control"] });
    w = go(w, { ...who.patient, type: "logCheckIn", patientId: ari, checkIn: { date: "2026-11-18", mood: 3, sleep: 2, energy: 3, skin: 4 } });

    refuses(w, { ...who.ma, type: "startReferral", patientId: ari, pcpId: "cedar", specialty: "endo" }, /shared record first/);
    w = go(w, { ...who.patient, type: "createShareCode", patientId: ari, sections: ["story", "trends", "results", "meds", "summaries"] });
    const code = w.shareCodes.at(-1)!.code;
    const dob = "1998-04-09";
    refuses(w, { ...who.ma, type: "redeemShareCode", code, dob, practiceId: "cedar" }, /expired/, later(NOW, 16));
    refuses(w, { ...who.ma, type: "redeemShareCode", code, dob: "1998-04-10", practiceId: "cedar" }, /date of birth/);
    w = go(w, { ...who.ma, type: "redeemShareCode", code: code.toLowerCase().replace("-", " "), dob, practiceId: "cedar" });
    refuses(w, { ...who.ma, type: "redeemShareCode", code, dob, practiceId: "cedar" }, /already used/);
    expect(canSee(w, ari, "cedar", "insurance")).toBe(false);

    w = go(w, { ...who.ma, type: "startReferral", patientId: ari, pcpId: "cedar", specialty: "endo" });
    const id = ariReferral(w).id;
    const sign: Command = { ...who.doc, type: "signAndSend", referralId: id, reason: "Irregular cycles for three years; please evaluate.", urgent: false, attested: true, faxPracticeId: null };
    refuses(w, { ...sign, ...who.ma }, /pcp_physician/);
    refuses(w, { ...sign, attested: false }, /evaluated this patient/);
    w = go(w, sign);
    expect(ariReferral(w).status).toBe("needs_info");
    expect(ariReferral(w).missing).toContain("TSH within 12 months");

    for (const result of demoChart(ari, NOW)) w = go(w, { ...who.ma, type: "attachResult", referralId: id, result });
    expect(ariReferral(w).status).toBe("insurance_pending");
    expect(w.notices.at(-1)?.text).toMatch(/insurance card/);

    w = go(w, { ...who.patient, type: "captureInsuranceCard", patientId: ari, planId: "lonestar-ppo", memberIdLast4: "0417" });
    expect(ariReferral(w).status).toBe("insurance_pending");
    w = go(w, { ...who.ops, type: "verifyInsurance", patientId: ari });
    expect(ariReferral(w).status).toBe("on_waitlist");

    w = post(w, THU_AFTERNOON);
    const offer = pendingFor(w, ari)[0]!;
    expect(ariReferral(w).status).toBe("offered");
    expect(canSee(w, ari, DEMO_IDS.endo, "story")).toBe(false);
    w = go(w, { ...who.patient, type: "acceptOffer", offerId: offer.id }, later(NOW, 0.1));
    expect(ariReferral(w).status).toBe("booked");
    for (const s of PACK_SECTIONS) expect(canSee(w, ari, DEMO_IDS.endo, s)).toBe(true);
    expect(w.log.at(-1)?.shared).toEqual({ recipientId: DEMO_IDS.endo, sections: [...PACK_SECTIONS] });

    const slotId = w.slots.at(-1)!.id;
    w = go(w, { ...who.patient, type: "confirmVisit", slotId, update: "" }, later(NOW, 1));
    expect(w.slots.at(-1)!.status).toBe("confirmed");
    refuses(w, { ...who.desk, type: "markAttended", slotId }, /hasn't started/, later(NOW, 2));
    const visitEnd = later(THU_AFTERNOON, 45);
    w = go(w, { ...who.desk, type: "markAttended", slotId }, visitEnd);
    expect(ariReferral(w).status).toBe("seen");
    expect(w.ledger).toEqual([expect.objectContaining({ practiceId: DEMO_IDS.endo, amountCents: 4000, billed: false })]);

    w = go(w, { by: "specialist_provider", who: "Dr. Ana Rivera (example)", type: "uploadSummary", slotId, text: "Reviewed history and results with the patient. Plan agreed together.", followUp: "Follow up in 8 weeks.", backToPcp: true }, visitEnd);
    expect(ariReferral(w).status).toBe("closed");
    expect(w.notices.some((n) => n.to.kind === "practice" && n.to.id === "cedar")).toBe(true);
    expect(w.log.at(-1)?.shared).toEqual({ recipientId: "cedar", sections: ["summaries"] });
  });
});

describe("offers race and time out", () => {
  it("first to accept wins; the other sees that the slot filled", () => {
    let w = post(fill(), THU_AFTERNOON);
    const [mine, theirs] = [pendingFor(w, ari)[0]!, pendingFor(w, "p-jb")[0]!];
    w = go(w, { ...who.ops, type: "simulateReply", offerId: theirs.id, accept: true }, later(NOW, 0.05));
    expect(w.offers.find((o) => o.id === mine.id)?.status).toBe("superseded");
    expect(ariReferral(w).status).toBe("on_waitlist");
    refuses(w, { ...who.patient, type: "acceptOffer", offerId: mine.id }, /That slot just filled\. You're still on the list\./, later(NOW, 0.1));
  });

  it("refuses to simulate a reply for the patient who has the app", () => {
    const w = post(fill(), THU_AFTERNOON);
    refuses(w, { ...who.ops, type: "simulateReply", offerId: pendingFor(w, ari)[0]!.id, accept: true }, /synthetic patients/);
  });

  it("expires holds, then closes unfilled once nobody else matches", () => {
    let w = post(fill(), THU_AFTERNOON);
    w = settle(w, later(NOW, 0.5));
    expect(w.offers.every((o) => o.status === "expired")).toBe(true);
    expect(w.slots.at(-1)).toMatchObject({ status: "unfilled", unfilledReason: expect.stringMatching(/Offered to 2 patients/) });
    expect(ariReferral(w).status).toBe("on_waitlist");
  });

  it("moves to the next patient when one declines", () => {
    let w = post({ ...fill(), clock: { speed: 1, pausedAt: null, offsetMs: 0 } }, "2026-11-20T20:40:00.000Z");
    expect(pendingFor(w, ari)).toHaveLength(1);
    w = go(w, { ...who.patient, type: "declineOffer", offerId: pendingFor(w, ari)[0]!.id }, later(NOW, 1));
    expect(pendingFor(w, "p-jb")).toHaveLength(1);
    expect(w.slots.at(-1)!.rounds).toBe(2);
  });

  it("does not expire holds while the demo clock is paused, and extends them on resume", () => {
    let w = go(fill(), { ...who.ops, type: "setClock", clock: { paused: true } });
    w = post(w, THU_AFTERNOON);
    w = settle(w, later(NOW, 5));
    expect(pendingFor(w, ari)).toHaveLength(1);
    w = go(w, { ...who.ops, type: "setClock", clock: { paused: false } }, later(NOW, 5));
    expect(pendingFor(w, ari)[0]!.expiresAt).toBe(new Date(new Date(NOW).getTime() + 5 * 60_000 + 15_000).toISOString());
  });

  it("withdrawing an opening releases everyone holding it", () => {
    let w = post(fill(), THU_AFTERNOON);
    w = go(w, { ...who.desk, type: "withdrawSlot", slotId: w.slots.at(-1)!.id }, later(NOW, 0.05));
    expect(w.offers.every((o) => o.status === "superseded")).toBe(true);
    expect(ariReferral(w).status).toBe("on_waitlist");
  });
});

describe("consent and viewing", () => {
  it("logs each view, refuses unshared sections and ignores repeat views within ten minutes", () => {
    let w = fill();
    refuses(w, { ...who.desk, type: "viewRecord", patientId: ari, recipientId: DEMO_IDS.endo, sections: ["story"] }, /hasn't shared patient story/);
    const before = w.views.length;
    w = go(w, { ...who.ma, type: "viewRecord", patientId: ari, recipientId: "cedar", sections: ["story"] });
    w = go(w, { ...who.ma, type: "viewRecord", patientId: ari, recipientId: "cedar", sections: ["story"] }, later(NOW, 2));
    expect(w.views.length).toBe(before + 1);
  });

  it("revoking a section stops it reaching that recipient, including visit summaries", () => {
    let w = post(fill(), THU_AFTERNOON);
    w = go(w, { ...who.patient, type: "acceptOffer", offerId: pendingFor(w, ari)[0]!.id }, later(NOW, 0.1));
    w = go(w, { ...who.patient, type: "setConsent", patientId: ari, recipientId: "cedar", section: "summaries", on: false }, later(NOW, 1));
    w = go(w, { ...who.patient, type: "setConsent", patientId: ari, recipientId: DEMO_IDS.endo, section: "meds", on: false }, later(NOW, 1));
    refuses(w, { ...who.desk, type: "viewRecord", patientId: ari, recipientId: DEMO_IDS.endo, sections: ["meds"] }, /medications/);
    const slotId = w.slots.at(-1)!.id;
    const end = later(THU_AFTERNOON, 45);
    w = go(w, { ...who.desk, type: "markAttended", slotId }, end);
    w = go(w, { ...who.desk, type: "uploadSummary", slotId, text: "Visit summary text long enough to count.", followUp: "", backToPcp: true }, end);
    expect(ariReferral(w).status).toBe("closed");
    expect(w.notices.some((n) => n.to.id === "cedar")).toBe(false);
    expect(w.log.at(-1)?.summary).toMatch(/not sent to Cedar/);
  });
});

describe("audit, fees and fallback", () => {
  it("keeps the audit log append-only", () => {
    const w0 = fill();
    const w1 = post(w0, THU_AFTERNOON);
    expect(w1.log.slice(0, w0.log.length)).toEqual(w0.log);
    expect(w1.log.map((e) => e.seq)).toEqual(w1.log.map((_, i) => i + 1));
  });

  it("accrues fees to specialist practices only, never PCPs or patients", () => {
    let w = post(fill(), THU_AFTERNOON);
    w = go(w, { ...who.patient, type: "acceptOffer", offerId: pendingFor(w, ari)[0]!.id }, later(NOW, 0.1));
    expect(w.ledger).toHaveLength(0);
    w = go(w, { ...who.desk, type: "markAttended", slotId: w.slots.at(-1)!.id }, later(THU_AFTERNOON, 30));
    const payers = new Set(w.ledger.map((l) => w.practices.find((p) => p.id === l.practiceId)?.kind));
    expect([...payers]).toEqual(["specialist"]);
  });

  it("sends to an off-Attune practice by fallback without joining the waitlist, and refuses unverified fax numbers", () => {
    let w = demoWorld(NOW, "fill");
    w = go(w, { ...who.ma, type: "startReferral", patientId: ari, pcpId: "cedar", specialty: "gyno" });
    const id = ariReferral(w).id;
    const base = { ...who.doc, type: "signAndSend" as const, referralId: id, reason: "Please evaluate irregular cycles.", urgent: false, attested: true };
    refuses(w, { ...base, faxPracticeId: "lakeside-endo" }, /in this specialty/);
    w = go(w, { ...base, faxPracticeId: "uptown-gyno" });
    expect(ariReferral(w)).toMatchObject({ status: "sent", route: "fax" });
    expect(w.log.at(-1)?.summary).toMatch(/not transmitted/);
  });
});
