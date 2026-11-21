import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEMO_IDS, HOLD_POLICY, holdRule, matchSlot, orderCandidates, type World } from "../src";
import { FRI_AFTERNOON, NOW, SAT_MORNING, THU_AFTERNOON, ari, fill, later, pendingFor, post } from "./helpers";

const slotOf = (w: World) => w.slots.at(-1)!;

describe("who gets offered a cancellation", () => {
  it("offers a 4–24 h slot to two patients at once, Ari first because she has waited longest", () => {
    const w = post(fill(), THU_AFTERNOON);
    const offers = w.offers.filter((o) => o.slotId === slotOf(w).id);
    expect(offers.map((o) => o.patientId)).toEqual([ari, "p-jb"]);
    expect(slotOf(w).status).toBe("offering");
    // 15-minute hold at the demo's 60x speed is 15 seconds.
    expect(new Date(offers[0]!.expiresAt).getTime() - new Date(NOW).getTime()).toBe(15_000);
  });

  it("offers a 24–48 h slot to one patient with a one-hour hold", () => {
    const w = post({ ...fill(), clock: { speed: 1, pausedAt: null, offsetMs: 0 } }, FRI_AFTERNOON);
    const offers = w.offers.filter((o) => o.slotId === slotOf(w).id);
    expect(offers.map((o) => o.patientId)).toEqual([ari]);
    expect(new Date(offers[0]!.expiresAt).getTime() - new Date(NOW).getTime()).toBe(60 * 60_000);
  });

  it("names why everyone else was skipped, as counts only", () => {
    const w = fill();
    const m = matchSlot(w, { ...post(w, THU_AFTERNOON).slots.at(-1)!, status: "open" }, NOW);
    expect(m.skipped).toEqual({ distance: 1, insurance_stale: 1, plan: 1, notice: 1 });
  });

  it("closes as unfilled with a readable reason when nobody matches", () => {
    const w = post(fill(), SAT_MORNING);
    expect(slotOf(w).status).toBe("unfilled");
    expect(slotOf(w).unfilledReason).toMatch(/None of the 6 waiting matched: .*day doesn't work/);
    expect(w.notices.at(-1)).toMatchObject({ to: { kind: "practice", id: DEMO_IDS.endo } });
  });

  it("puts the PCP urgency flag ahead of time on the waitlist", () => {
    const base = fill();
    const w = { ...base, referrals: base.referrals.map((r) => (r.patientId === "p-jb" ? { ...r, urgent: true } : r)) };
    const offers = post(w, THU_AFTERNOON).offers;
    expect(offers.map((o) => o.patientId)).toEqual(["p-jb", ari]);
  });

  it("skips distance for telehealth only when she said yes to telehealth", () => {
    const w = post(fill(), THU_AFTERNOON, NOW, { mode: "telehealth" });
    const m = matchSlot(fill(), { ...slotOf(w), status: "open" }, NOW);
    expect(m.skipped.distance).toBeUndefined();
    expect(m.skipped.telehealth).toBe(1);
  });

  it("never sends a second live offer to someone already holding one", () => {
    let w = post(fill(), THU_AFTERNOON);
    w = post(w, FRI_AFTERNOON, later(NOW, 0.05));
    expect(pendingFor(w, ari)).toHaveLength(1);
    expect(w.offers.filter((o) => o.slotId === slotOf(w).id).map((o) => o.patientId)).not.toContain(ari);
  });
});

describe("never ranks by who pays (constitution rule 3)", () => {
  const offerOrder = (w: World) => post(w, THU_AFTERNOON).offers.map((o) => o.patientId);

  it("is invariant to fee terms", () => {
    const base = fill();
    const noFees = { ...base, feeTerms: {} };
    const bigFee = { ...base, feeTerms: { ...base.feeTerms, [DEMO_IDS.endo]: { amountCents: 999_00, trigger: "booked" as const } } };
    expect(offerOrder(noFees)).toEqual(offerOrder(base));
    expect(offerOrder(bigFee)).toEqual(offerOrder(base));
  });

  it("is invariant to which accepted plan a patient carries", () => {
    const base = fill();
    const swapped = {
      ...base,
      patients: base.patients.map((p) => (p.insurance && p.id !== "p-mo" ? { ...p, insurance: { ...p.insurance, planId: p.insurance.planId === "lonestar-ppo" ? "pecan-pos" : "lonestar-ppo" } } : p)),
    };
    expect(offerOrder(swapped)).toEqual(offerOrder(base));
  });

  it("orders on urgency, wait and distance alone", () => {
    const list = [
      { referralId: "a", urgent: false, waitlistSince: "2026-11-01", miles: 1 },
      { referralId: "b", urgent: true, waitlistSince: "2026-11-10", miles: 9 },
      { referralId: "c", urgent: false, waitlistSince: "2026-11-01", miles: 0.5 },
    ];
    expect(orderCandidates(list).map((c) => c.referralId)).toEqual(["b", "c", "a"]);
  });

  it("matching and criteria code do not mention fees, partners or billing", () => {
    for (const file of ["matching.ts", "criteria.ts"]) {
      const src = readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8");
      expect(src).not.toMatch(/feeTerms|amountCents|partner|ledger|billed/);
    }
  });
});

describe("hold policy", () => {
  it("matches the handoff defaults at each band", () => {
    const at = (h: number) => holdRule(new Date(new Date(NOW).getTime() + h * 3_600_000).toISOString(), NOW);
    expect([at(72), at(30), at(10), at(2)].map((r) => [r.holdMinutes, r.batch])).toEqual([[120, 1], [60, 1], [15, 2], [5, 3]]);
    expect(HOLD_POLICY).toHaveLength(4);
  });
});
