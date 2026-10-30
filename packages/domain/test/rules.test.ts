import { describe, expect, it } from "vitest";
import {
  DEMO_EVIDENCE,
  DEMO_SPECIALISTS,
  assessRotterdam,
  demoReferral,
  draftCodes,
  rankSpecialists,
  referralRequirement,
  toFhirBundle,
} from "../src";

describe("specialist ranking", () => {
  it("orders by network, soonest opening, PMOS experience, then distance", () => {
    const ids = rankSpecialists(DEMO_SPECIALISTS, "PPO", 4).map((m) => m.specialist.id);
    expect(ids).toEqual(["raman", "cole", "hill", "ortiz"]);
  });

  it("drops out-of-network offices on plans that would not cover them", () => {
    expect(rankSpecialists(DEMO_SPECIALISTS, "HMO", 4).map((m) => m.specialist.id)).not.toContain("ortiz");
  });

  it("is invariant to who pays Attune", () => {
    const flipped = DEMO_SPECIALISTS.map((s) => ({ ...s, partner: !s.partner }));
    const allPartners = DEMO_SPECIALISTS.map((s) => ({ ...s, partner: true }));
    const base = rankSpecialists(DEMO_SPECIALISTS, "PPO", 4).map((m) => m.specialist.id);
    expect(rankSpecialists(flipped, "PPO", 4).map((m) => m.specialist.id)).toEqual(base);
    expect(rankSpecialists(allPartners, "PPO", 4).map((m) => m.specialist.id)).toEqual(base);
  });
});

describe("coverage rules", () => {
  it("HMO and POS need a referral, PPO and EPO do not", () => {
    expect(referralRequirement("HMO").referralRequired).toBe(true);
    expect(referralRequirement("POS").referralRequired).toBe(true);
    expect(referralRequirement("PPO").referralRequired).toBe(false);
    expect(referralRequirement("EPO").referralRequired).toBe(false);
  });
});

describe("Rotterdam evidence mapping", () => {
  const summary = assessRotterdam(DEMO_EVIDENCE);

  it("maps the demo record to two supported domains and flags the lab gap", () => {
    const status = Object.fromEntries(summary.criteria.map((c) => [c.id, c.status]));
    expect(status).toEqual({ ovulatory: "met", clinical_ha: "met", biochemical_ha: "needs_labs", morphology: "clinician_review" });
    expect(summary.domainsMet).toBe(2);
    expect(summary.consistentWithCriteria).toBe(true);
    expect(summary.gaps[0]).toMatch(/testosterone/i);
  });

  it("never states a diagnosis", () => {
    expect(summary.headline).toMatch(/clinician confirmation/);
    expect(summary.headline.toLowerCase()).not.toMatch(/diagnosed|you have pmos|diagnosis of/);
  });

  it("needs at least two cycles before judging ovulatory function", () => {
    const thin = assessRotterdam({ ...DEMO_EVIDENCE, cycleLengths: [50] });
    expect(thin.criteria[0]?.status).toBe("insufficient_data");
    expect(thin.consistentWithCriteria).toBe(false);
  });

  it("uses the 2023 guideline mFG threshold by default", () => {
    const low = assessRotterdam({ ...DEMO_EVIDENCE, mfgScores: [5] });
    expect(low.criteria[1]?.status).toBe("not_met");
    expect(assessRotterdam({ ...DEMO_EVIDENCE, mfgScores: [5], mfgThreshold: 4 }).criteria[1]?.status).toBe("met");
  });
});

describe("draft codes", () => {
  it("codes symptoms, not a suspected diagnosis", () => {
    const codes = draftCodes(assessRotterdam(DEMO_EVIDENCE), DEMO_EVIDENCE, { acne: true }).map((c) => c.code);
    expect(codes).toEqual(["N91.5", "L68.0", "L70.0", "E88.819"]);
    expect(codes).not.toContain("E28.2");
  });

  it("includes E28.2 only when the diagnosis is on file", () => {
    const codes = draftCodes(assessRotterdam(DEMO_EVIDENCE), DEMO_EVIDENCE, { diagnosisOnFile: true }).map((c) => c.code);
    expect(codes[0]).toBe("E28.2");
  });
});

describe("FHIR shapes", () => {
  it("emits a BSeR-style ServiceRequest, Task and Consent", () => {
    const specialist = DEMO_SPECIALISTS[0]!;
    const bundle = toFhirBundle({ ...demoReferral(), codes: ["N91.5"], stage: "sent" }, specialist);
    const types = bundle.entry.map((e) => e.resource.resourceType);
    expect(types).toEqual(["ServiceRequest", "Task", "Consent"]);
    expect(bundle.entry[1]?.resource.status).toBe("requested");
  });
});
