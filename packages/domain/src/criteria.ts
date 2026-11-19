/**
 * Completeness against a practice's published criteria. This checks that the paperwork is there; it never judges
 * whether she has a condition. The PCP decides who is qualified for a referral; the practice decides what it needs
 * to see first. Attune only compares the two.
 */
import { SECTION_STAFF } from "./labels";
import { monthsBetween } from "./time";
import type { Patient, Practice, Referral, Requirement, Result } from "./types";

export interface CriterionCheck {
  label: string;
  met: boolean;
  detail: string;
}

export interface Completeness {
  practiceId: string;
  complete: boolean;
  checks: CriterionCheck[];
}

export function requirementLabel(req: Requirement): string {
  switch (req.kind) {
    case "result":
      return `${req.name} within ${req.withinMonths} months`;
    case "checkins":
      return `${req.minDays} days of check-ins`;
    case "section":
      return `${SECTION_STAFF[req.section]} on file`;
  }
}

function newestResult(results: Result[], name: string): Result | undefined {
  return results.filter((r) => r.name === name).sort((a, b) => b.collectedOn.localeCompare(a.collectedOn))[0];
}

function checkRequirement(req: Requirement, patient: Patient, now: string): CriterionCheck {
  const label = requirementLabel(req);
  switch (req.kind) {
    case "result": {
      const found = newestResult(patient.results, req.name);
      if (!found) return { label, met: false, detail: "Not on file" };
      const age = monthsBetween(found.collectedOn, now);
      return age < req.withinMonths
        ? { label, met: true, detail: `${found.collectedOn}, ${found.source}` }
        : { label, met: false, detail: `Newest is from ${found.collectedOn}` };
    }
    case "checkins": {
      const days = new Set(patient.checkIns.map((c) => c.date)).size;
      return { label, met: days >= req.minDays, detail: `${days} logged` };
    }
    case "section": {
      const present =
        req.section === "story" ? patient.story !== null
        : req.section === "meds" ? patient.meds.length > 0
        : req.section === "results" ? patient.results.length > 0
        : req.section === "trends" ? patient.checkIns.length > 0
        : req.section === "insurance" ? patient.insurance !== null
        : true;
      return { label, met: present, detail: present ? "On file" : "Not on file" };
    }
  }
}

export function checkCompleteness(practice: Practice, patient: Patient, referral: Referral, now: string): Completeness {
  const signed: CriterionCheck = {
    label: "Signed PCP referral with a reason",
    met: referral.signature !== null && referral.reason.trim().length > 0,
    detail: referral.signature ? `Signed by ${referral.signature.signer}` : "Not signed",
  };
  const checks = [signed, ...practice.criteria.map((req) => checkRequirement(req, patient, now))];
  return { practiceId: practice.id, complete: checks.every((c) => c.met), checks };
}

/** Practices on Attune for the referral's specialty, each checked. Qualified means complete for at least one. */
export function checkAcrossSpecialty(
  practices: Practice[],
  patient: Patient,
  referral: Referral,
  now: string,
): { qualified: boolean; results: Completeness[]; missing: string[] } {
  const results = practices
    .filter((p) => p.kind === "specialist" && p.onAttune && p.specialty === referral.specialty)
    .map((p) => checkCompleteness(p, patient, referral, now));
  const qualified = results.some((r) => r.complete);
  const missing = qualified
    ? []
    : [...new Set(results.flatMap((r) => r.checks.filter((c) => !c.met).map((c) => c.label)))];
  return { qualified, results, missing };
}
