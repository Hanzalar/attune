import { describe, expect, it } from "vitest";
import { PATIENT_TEXT, PRACTICE_TEXT, toFhirBundle, run } from "../src";
import { NOW, THU_AFTERNOON, ari, fill, later, pendingFor, post, who } from "./helpers";

/** Words that would reveal health details or who she is seeing. */
const HEALTH = /pmos|pcos|endo|gyn|ovar|hormone|testosterone|insulin|a1c|tsh|lab|result|diagnos|symptom|cycle|period|bluebonnet|women's|medication|metformin/i;

describe("notification text carries no health details", () => {
  it("holds for every patient template, each short enough for one SMS", () => {
    for (const text of Object.values(PATIENT_TEXT)) {
      expect(text).not.toMatch(HEALTH);
      expect(text.length).toBeLessThanOrEqual(160);
    }
  });

  it("tells patients when an offer went to others too", () => {
    const w = post(fill(), THU_AFTERNOON);
    const offerTexts = w.notices.filter((n) => n.to.kind === "patient").slice(-2).map((n) => n.text);
    expect(offerTexts).toEqual([PATIENT_TEXT.offerShared, PATIENT_TEXT.offerShared]);
  });

  it("holds for every practice template", () => {
    for (const make of Object.values(PRACTICE_TEXT)) {
      const text = typeof make === "function" ? make("Thu Nov 19, 2:40 PM") : make;
      expect(text).not.toMatch(HEALTH);
    }
  });

  it("holds for every notice a full demo run produces", () => {
    let w = post(fill(), THU_AFTERNOON);
    w = run(w, { ...who.patient, type: "acceptOffer", offerId: pendingFor(w, ari)[0]!.id }, later(NOW, 0.1));
    expect(w.notices.length).toBeGreaterThan(3);
    for (const n of w.notices) expect(n.text).not.toMatch(HEALTH);
  });
});

describe("FHIR shapes (BSeR)", () => {
  it("emits a ServiceRequest, a Task and one Consent per recipient", () => {
    let w = post(fill(), THU_AFTERNOON);
    w = run(w, { ...who.patient, type: "acceptOffer", offerId: pendingFor(w, ari)[0]!.id }, later(NOW, 0.1));
    const referral = w.referrals.find((r) => r.patientId === ari)!;
    const bundle = toFhirBundle(w, referral);
    expect(bundle.entry.map((e) => e.resource.resourceType)).toEqual(["ServiceRequest", "Task", "Consent", "Consent"]);
    expect(bundle.entry[0]?.resource).toMatchObject({ status: "active", occurrenceDateTime: THU_AFTERNOON, priority: "routine" });
    expect(bundle.entry[1]?.resource.status).toBe("in-progress");
  });
});
