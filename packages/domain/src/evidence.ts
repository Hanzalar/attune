/**
 * Maps tracked patient data to the Rotterdam criteria as applied by the 2023 International
 * Evidence-based Guideline for PCOS (now PMOS). Decision support only: the output says which
 * criteria the data supports and what is missing. It never states a diagnosis.
 */

export type CriterionStatus = "met" | "not_met" | "needs_labs" | "clinician_review" | "insufficient_data";

export interface Criterion {
  id: "ovulatory" | "clinical_ha" | "biochemical_ha" | "morphology";
  label: string;
  status: CriterionStatus;
  detail: string;
  source: string;
}

export interface EvidenceInput {
  /** Lengths of completed tracked cycles, in days. */
  cycleLengths: number[];
  /** Modified Ferriman-Gallwey scores over time, oldest first. */
  mfgScores: number[];
  /** Hirsutism threshold. The 2023 guideline uses mFG >= 4-6 depending on ethnicity; default to the upper end. */
  mfgThreshold?: number;
  labs: {
    totalTestosterone?: { value: number; high: boolean };
    freeTestosterone?: { value: number; high: boolean };
    shbg?: number;
    homaIr?: number;
  };
  ultrasoundReportOnFile: boolean;
  sources: { cycles: string; photos: string; labs: string; uploads: string };
}

export interface EvidenceSummary {
  criteria: Criterion[];
  /** Count of the three Rotterdam domains (ovulatory, hyperandrogenism, morphology) the data supports. */
  domainsMet: number;
  consistentWithCriteria: boolean;
  headline: string;
  gaps: string[];
  supporting: string[];
}

export const MFG_DEFAULT_THRESHOLD = 6;

export function assessRotterdam(input: EvidenceInput): EvidenceSummary {
  const threshold = input.mfgThreshold ?? MFG_DEFAULT_THRESHOLD;
  const cycles = input.cycleLengths;
  const irregular = cycles.filter((d) => d > 35 || d < 21).length;
  const min = Math.min(...cycles);
  const max = Math.max(...cycles);

  const ovulatory: Criterion = {
    id: "ovulatory",
    label: "Ovulatory dysfunction",
    source: input.sources.cycles,
    ...(cycles.length < 2
      ? { status: "insufficient_data", detail: "Fewer than 2 tracked cycles." }
      : irregular * 2 > cycles.length
        ? { status: "met", detail: `${irregular} of ${cycles.length} tracked cycles outside 21-35 days (${min}-${max} d).` }
        : { status: "not_met", detail: `${cycles.length - irregular} of ${cycles.length} tracked cycles within 21-35 days.` }),
  };

  const latestMfg = input.mfgScores.at(-1);
  const firstMfg = input.mfgScores[0];
  const trend = firstMfg !== undefined && latestMfg !== undefined && latestMfg < firstMfg ? `, easing from ${firstMfg}` : "";
  const clinical: Criterion = {
    id: "clinical_ha",
    label: "Clinical hyperandrogenism",
    source: input.sources.photos,
    ...(latestMfg === undefined
      ? { status: "insufficient_data", detail: "No mFG score tracked yet." }
      : latestMfg >= threshold
        ? { status: "met", detail: `mFG ${latestMfg} (>= ${threshold} per 2023 guideline${trend}).` }
        : { status: "not_met", detail: `mFG ${latestMfg} (below ${threshold}${trend}).` }),
  };

  const { totalTestosterone: tt, freeTestosterone: ft } = input.labs;
  const biochemical: Criterion = {
    id: "biochemical_ha",
    label: "Biochemical hyperandrogenism",
    source: input.sources.labs,
    ...(!tt && !ft
      ? { status: "needs_labs", detail: "Total/free testosterone and SHBG not on file." }
      : tt?.high || ft?.high
        ? { status: "met", detail: "Elevated testosterone on file." }
        : { status: "not_met", detail: "Testosterone within reference range." }),
  };

  const morphology: Criterion = {
    id: "morphology",
    label: "Polycystic ovarian morphology",
    source: input.sources.uploads,
    status: input.ultrasoundReportOnFile ? "clinician_review" : "insufficient_data",
    detail: input.ultrasoundReportOnFile
      ? "Ultrasound report uploaded. Attune does not read imaging; clinician interprets."
      : "No ultrasound or AMH on file.",
  };

  const hyperandrogenism = clinical.status === "met" || biochemical.status === "met";
  const domainsMet = Number(ovulatory.status === "met") + Number(hyperandrogenism);
  const consistentWithCriteria = domainsMet >= 2;

  const gaps: string[] = [];
  if (biochemical.status === "needs_labs") gaps.push("Free and total testosterone, SHBG");
  gaps.push("Exclude other causes: TSH, prolactin, 17-OH progesterone");
  if (input.labs.homaIr === undefined) gaps.push("Fasting insulin / glucose (HOMA-IR)");
  gaps.push("2-h 75 g OGTT and fasting lipids (metabolic screen)");
  gaps.push("Depression and anxiety screen (guideline-recommended)");

  const supporting: string[] = [];
  if (input.labs.homaIr !== undefined && input.labs.homaIr > 2.5) supporting.push(`HOMA-IR ${input.labs.homaIr} (elevated, > 2.5)`);

  return {
    criteria: [ovulatory, clinical, biochemical, morphology],
    domainsMet,
    consistentWithCriteria,
    headline: consistentWithCriteria
      ? `${domainsMet} of 3 Rotterdam domains supported without imaging. Pattern consistent with the criteria; clinician confirmation and exclusion of other causes required.`
      : `${domainsMet} of 3 Rotterdam domains supported so far. Not enough to suggest the criteria are met; see gaps.`,
    gaps,
    supporting,
  };
}
