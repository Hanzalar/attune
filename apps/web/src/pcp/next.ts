/**
 * What happens next on a referral and who owns it, in the MA's words. Display copy keyed by the domain's statuses;
 * the rules that move a referral live in @attune/domain.
 */
import { demoChart, type Patient, type Referral, type ReferralStatus, type Result } from "@attune/domain";

const NEXT: Record<ReferralStatus, { step: string; owner: string }> = {
  draft: { step: "Physician signs and sends", owner: "Your office" },
  sent: { step: "Checked against practice criteria", owner: "Attune" },
  needs_info: { step: "Attach what's missing", owner: "Your office" },
  qualified: { step: "Insurance check", owner: "Attune" },
  insurance_pending: { step: "Insurance card and check", owner: "Patient, then Attune" },
  insurance_issue: { step: "Fix insurance details", owner: "Patient" },
  on_waitlist: { step: "Waiting for a matching opening", owner: "Attune" },
  offered: { step: "Answering an offer", owner: "Patient" },
  booked: { step: "Visit; she confirms the day before", owner: "Patient and specialist" },
  seen: { step: "Visit summary", owner: "Specialist" },
  summary_received: { step: "Filing the summary", owner: "Attune" },
  closed: { step: "Done; summary in your inbox", owner: "—" },
};

export function nextStep(r: Referral, patient: Patient | undefined): { step: string; owner: string } {
  if (r.route === "fax") return { step: "Prepared for the fax fallback (not transmitted)", owner: "Your office" };
  if (r.status === "insurance_pending") {
    return patient?.insurance?.cardCapturedAt ? { step: "Coverage check", owner: "Attune" } : { step: "Add her insurance card", owner: "Patient" };
  }
  return NEXT[r.status];
}

/** Results in your chart (mocked EMR) that would fill a missing requirement and aren't on her record yet. */
export function attachable(patient: Patient, names: string[], now: string): Result[] {
  return demoChart(patient.id, now).filter(
    (c) => names.includes(c.name) && !patient.results.some((r) => r.name === c.name && r.collectedOn === c.collectedOn),
  );
}

/** Result names a needs-info referral is missing, read back from the domain's labels ("TSH within 12 months"). */
export function missingResultNames(r: Referral, chart: Result[]): string[] {
  return chart.map((c) => c.name).filter((name) => r.missing.some((m) => m.startsWith(`${name} within`)));
}
