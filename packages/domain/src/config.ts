/**
 * Product constants. The fill policy numbers are the handoff's starting defaults; change them here, not in views.
 */
import type { SectionKey } from "./types";

/** The product name, in one place. Views, notifications and documents read it from here. */
export const PRODUCT_NAME = "Attune";

export interface HoldRule {
  /** Applies when the slot starts more than this many hours from now. */
  aboveHours: number;
  label: string;
  holdMinutes: number;
  /** How many patients get the offer at once. First to accept wins. */
  batch: number;
}

/** Ordered from the longest lead time down; the first rule whose `aboveHours` the lead time exceeds applies. */
export const HOLD_POLICY: readonly HoldRule[] = [
  { aboveHours: 48, label: "More than 48 hours", holdMinutes: 120, batch: 1 },
  { aboveHours: 24, label: "24 to 48 hours", holdMinutes: 60, batch: 1 },
  { aboveHours: 4, label: "4 to 24 hours", holdMinutes: 15, batch: 2 },
  { aboveHours: Number.NEGATIVE_INFINITY, label: "Under 4 hours", holdMinutes: 5, batch: 3 },
];

/** An insurance check older than this does not qualify her for an offer. */
export const INSURANCE_FRESH_HOURS = 24;

/** A share code works once, for this long. */
export const SHARE_CODE_MINUTES = 15;

/** The day-before confirmation opens this many hours before the visit. */
export const CONFIRM_WINDOW_HOURS = 36;

/** Demo mode runs hold windows faster. 60 turns minutes into seconds. */
export const DEMO_SPEEDS = [1, 10, 60] as const;
export const DEFAULT_DEMO_SPEED = 60;

export const ATTESTATION = "I evaluated this patient and this referral reflects my clinical judgment.";

/** What a specialist receives on acceptance. The PCP referral note always travels with the referral itself. */
export const PACK_SECTIONS: readonly SectionKey[] = ["story", "trends", "results", "meds", "insurance"];
export const ALL_SECTIONS: readonly SectionKey[] = ["story", "trends", "results", "meds", "insurance", "summaries"];

/** Onboarding choices. Shown back to her and her doctors as she picked them; never scored. */
export const HARDEST_OPTIONS = ["Sleep", "Mood", "Skin", "Energy", "Irregular cycles", "Weight", "Hair", "Pain"] as const;
export const HELP_OPTIONS = [
  "Seeing a specialist sooner",
  "Not retelling my story",
  "Keeping my doctors on the same page",
  "Tracking how I feel",
] as const;
export const TRIED_OPTIONS = [
  "Birth control",
  "Metformin",
  "Inositol",
  "Spironolactone",
  "Diet changes",
  "More exercise",
  "Nothing yet",
] as const;
export const MAX_HARDEST = 3;
