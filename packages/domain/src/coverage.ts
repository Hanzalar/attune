import type { NetworkStatus, PlanType } from "./types";

export interface ReferralRequirement {
  /** The plan needs a PCP referral on file before the specialist visit is covered. */
  referralRequired: boolean;
  /** A physician (not only the MA) must sign the referral. */
  physicianSignature: boolean;
  /** Out-of-network specialists are not covered at all on this plan type. */
  outOfNetworkExcluded: boolean;
  /** Plain-language line for the patient app. */
  patientNote: string;
  /** Always true: plan-type rules are defaults, the specific plan can differ. */
  verifyWithPlan: true;
}

/**
 * Rule-of-thumb referral requirements by US commercial plan type.
 * These are defaults for drafting only; the MA confirms the member's actual plan before signing.
 */
export function referralRequirement(plan: PlanType): ReferralRequirement {
  switch (plan) {
    case "HMO":
      return {
        referralRequired: true,
        physicianSignature: true,
        outOfNetworkExcluded: true,
        patientNote: "Your plan is an HMO, so the visit needs a referral signed by your PCP.",
        verifyWithPlan: true,
      };
    case "POS":
      return {
        referralRequired: true,
        physicianSignature: true,
        outOfNetworkExcluded: false,
        patientNote: "Your plan is a POS plan, so in-network specialist visits need a PCP referral.",
        verifyWithPlan: true,
      };
    case "EPO":
      return {
        referralRequired: false,
        physicianSignature: false,
        outOfNetworkExcluded: true,
        patientNote: "Your plan is an EPO: no referral needed, but the gyno must be in network.",
        verifyWithPlan: true,
      };
    case "PPO":
      return {
        referralRequired: false,
        physicianSignature: false,
        outOfNetworkExcluded: false,
        patientNote:
          "Your plan is a PPO, so a referral isn't required. Your PCP's office still signs off so the gyno gets your history.",
        verifyWithPlan: true,
      };
  }
}

export function isCoverable(plan: PlanType, network: NetworkStatus): boolean {
  return !(referralRequirement(plan).outOfNetworkExcluded && network === "out");
}
