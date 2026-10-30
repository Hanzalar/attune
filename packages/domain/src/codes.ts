import type { EvidenceInput, EvidenceSummary } from "./evidence";

export interface DraftCode {
  code: string;
  display: string;
  why: string;
}

/**
 * Draft ICD-10-CM codes for the referral reason. Outpatient coding does not code "suspected" conditions,
 * so E28.2 is only drafted when PMOS is already on the problem list; otherwise the symptoms are coded.
 * Always a draft: the PCP's MA confirms codes before signing.
 */
export function draftCodes(
  evidence: EvidenceSummary,
  input: Pick<EvidenceInput, "labs">,
  opts: { diagnosisOnFile?: boolean; acne?: boolean } = {},
): DraftCode[] {
  const out: DraftCode[] = [];
  if (opts.diagnosisOnFile) out.push({ code: "E28.2", display: "Polycystic ovarian syndrome", why: "Diagnosis already on the problem list" });
  const byId = Object.fromEntries(evidence.criteria.map((c) => [c.id, c]));
  if (byId.ovulatory?.status === "met") out.push({ code: "N91.5", display: "Oligomenorrhea, unspecified", why: byId.ovulatory.detail });
  if (byId.clinical_ha?.status === "met") out.push({ code: "L68.0", display: "Hirsutism", why: byId.clinical_ha.detail });
  if (opts.acne) out.push({ code: "L70.0", display: "Acne vulgaris", why: "Tracked acne symptoms" });
  if (input.labs.homaIr !== undefined && input.labs.homaIr > 2.5) {
    out.push({ code: "E88.819", display: "Insulin resistance, unspecified", why: `HOMA-IR ${input.labs.homaIr}` });
  }
  return out;
}
