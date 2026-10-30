import { describe, expect, it } from "vitest";
import {
  DEMO_SLOT,
  DEMO_SPECIALISTS,
  DomainError,
  apply,
  chooseChannel,
  demoReferral,
  dispatch,
  nextStep,
  toFhirBundle,
  type Command,
  type Referral,
} from "../src";

const at = "2026-10-30T12:00:00Z";
const now = () => at;
const run = (r: Referral, ...cmds: Command[]) => cmds.reduce((acc, c) => dispatch(acc, c, DEMO_SPECIALISTS, now), r);

const approve: Command = { type: "approveSharing", by: "patient", at };
const sign: Command = { type: "signReferral", by: "pcp_ma", at, codes: ["N91.5"], signer: "Alex R." };

describe("referral lifecycle", () => {
  it("walks the full PCP to OB/GYN loop and logs every step", () => {
    const r = run(
      demoReferral(),
      approve,
      sign,
      { type: "offerSlot", by: "specialist_staff", at, slot: DEMO_SLOT },
      { type: "bookSlot", by: "patient", at },
      { type: "completeVisit", by: "specialist_provider", at, outcome: "Labs ordered; follow up in 6 weeks." },
    );
    expect(r.stage).toBe("closed");
    expect(r.channel).toBe("efax");
    expect(r.bookedSlot).toEqual(DEMO_SLOT);
    expect(r.log.map((e) => e.type)).toEqual([
      "approveSharing", "signReferral", "deliver", "offerSlot", "bookSlot", "completeVisit", "closeLoop",
    ]);
    expect(r.log.find((e) => e.type === "deliver")?.shared).toEqual(["tracker", "photos", "portal", "labs", "uploads"]);
  });

  it("never sends before the PCP office signs", () => {
    const r = run(demoReferral(), approve);
    expect(r.stage).toBe("awaiting_pcp");
    expect(() => apply(r, { type: "deliver", by: "agent", at, channel: "efax" })).toThrow(DomainError);
  });

  it("only the patient can approve sharing, and only the PCP office can sign", () => {
    expect(() => apply(demoReferral(), { ...approve, by: "pcp_ma" })).toThrow(/patient/);
    const r = run(demoReferral(), approve);
    expect(() => apply(r, { ...sign, by: "specialist_staff" })).toThrow(/pcp_ma or pcp_physician/);
    expect(() => apply(r, { ...sign, by: "agent" })).toThrow(DomainError);
  });

  it("refuses an empty packet", () => {
    let r = demoReferral();
    for (const key of ["tracker", "photos", "portal", "labs", "uploads"] as const) {
      r = apply(r, { type: "toggleShare", by: "patient", at, key });
    }
    expect(() => apply(r, approve)).toThrow(/at least one item/);
  });

  it("requires a physician co-sign on HMO plans", () => {
    const hmo = { ...demoReferral(), plan: "HMO" as const };
    const afterMa = run(hmo, approve, sign);
    expect(afterMa.stage).toBe("awaiting_physician");
    expect(nextStep(afterMa).view).toBe("pcp");
    const signed = run(afterMa, { type: "signReferral", by: "pcp_physician", at, codes: ["N91.5"], signer: "Dr. Patel" });
    expect(signed.stage).toBe("sent");
    expect(signed.signatures).toEqual({ ma: "Alex R.", physician: "Dr. Patel" });
  });

  it("revoking consent before sending pulls the request back to a draft", () => {
    const r = run(demoReferral(), approve, { type: "revokeConsent", by: "patient", at });
    expect(r.stage).toBe("draft");
    expect(r.consent.grantedAt).toBeNull();
  });

  it("revoking after sending withdraws the referral and blocks further steps", () => {
    const r = run(demoReferral(), approve, sign, { type: "revokeConsent", by: "patient", at });
    expect(r.stage).toBe("withdrawn");
    expect(() => apply(r, { type: "offerSlot", by: "specialist_staff", at, slot: DEMO_SLOT })).toThrow(DomainError);
  });

  it("a decline needs a note back to the PCP and patient", () => {
    const r = run(demoReferral(), approve, sign);
    expect(() => apply(r, { type: "declineReferral", by: "specialist_staff", at, note: "  " })).toThrow(/note/);
    expect(apply(r, { type: "declineReferral", by: "specialist_staff", at, note: "Not taking new patients" }).stage).toBe("declined");
  });

  it("locks the specialist and shared items once approved", () => {
    const r = run(demoReferral(), approve);
    expect(() => apply(r, { type: "chooseSpecialist", by: "patient", at, specialistId: "cole" })).toThrow(DomainError);
    expect(() => apply(r, { type: "toggleShare", by: "patient", at, key: "labs" })).toThrow(DomainError);
  });
});

describe("delivery channel", () => {
  it("prefers FHIR, then Direct, then a verified fax", () => {
    expect(chooseChannel({ routes: { fhir: "https://x", direct: "a@b", fax: { number: "1", verified: true } } })).toBe("fhir");
    expect(chooseChannel({ routes: { direct: "a@b", fax: { number: "1", verified: true } } })).toBe("direct");
    expect(chooseChannel({ routes: { fax: { number: "1", verified: true } } })).toBe("efax");
  });

  it("refuses an unverified fax number", () => {
    expect(() => chooseChannel({ routes: { fax: { number: "1", verified: false } } })).toThrow(/verified/);
  });
});

describe("held time requested up front", () => {
  const hold: Command = { type: "holdSlot", by: "patient", at, slot: DEMO_SLOT };
  const confirm: Command = { type: "confirmRequestedSlot", by: "specialist_staff", at };

  it("books the patient's held time once the office confirms it, without a second patient step", () => {
    const r = run(demoReferral(), hold, approve, sign, confirm);
    expect(r.stage).toBe("booked");
    expect(r.bookedSlot).toEqual(DEMO_SLOT);
    expect(r.log.map((e) => e.type)).toEqual(["holdSlot", "approveSharing", "signReferral", "deliver", "confirmRequestedSlot"]);
  });

  it("still waits for the PCP office before the office can confirm", () => {
    const r = run(demoReferral(), hold, approve);
    expect(() => apply(r, confirm)).toThrow(/arrived/);
  });

  it("only specialist staff can confirm, and only when a time was requested", () => {
    const held = run(demoReferral(), hold, approve, sign);
    expect(() => apply(held, { ...confirm, by: "patient" })).toThrow(/specialist_staff/);
    const none = run(demoReferral(), approve, sign);
    expect(() => apply(none, confirm)).toThrow(/didn't request a time/);
  });

  it("switching offices releases the held time, and the time locks after approval", () => {
    const switched = run(demoReferral(), hold, { type: "chooseSpecialist", by: "patient", at, specialistId: "cole" });
    expect(switched.requestedSlot).toBeNull();
    const approved = run(demoReferral(), hold, approve);
    expect(() => apply(approved, { ...hold, slot: { label: "Nov 13, 9:20 AM", at: "2026-11-13T09:20:00-06:00" } })).toThrow(DomainError);
  });

  it("the office can still offer a different time instead", () => {
    const other = { label: "Nov 13, 9:20 AM", at: "2026-11-13T09:20:00-06:00" };
    const r = run(demoReferral(), hold, approve, sign, { type: "offerSlot", by: "specialist_staff", at, slot: other });
    expect(r.stage).toBe("offered");
    expect(run(r, { type: "bookSlot", by: "patient", at }).bookedSlot).toEqual(other);
  });

  it("revoking after sending releases the held time", () => {
    const r = run(demoReferral(), hold, approve, sign, { type: "revokeConsent", by: "patient", at });
    expect(r.stage).toBe("withdrawn");
    expect(r.requestedSlot).toBeNull();
  });

  it("carries the held time into the FHIR ServiceRequest", () => {
    const r = run(demoReferral(), hold, approve, sign);
    const sr = toFhirBundle(r, DEMO_SPECIALISTS[0]!).entry.map((e) => e.resource).find((x) => x.resourceType === "ServiceRequest");
    expect(sr).toMatchObject({ occurrenceDateTime: DEMO_SLOT.at });
  });
});
