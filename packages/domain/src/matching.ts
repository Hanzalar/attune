import { isCoverable } from "./coverage";
import type { PlanType, Specialist } from "./types";

/** Every field ranking may read. `partner` is deliberately absent. */
export type RankInput = Omit<Specialist, "partner">;

export interface RankedMatch<T extends RankInput = RankInput> {
  specialist: T;
  reasons: string[];
}

const NETWORK_ORDER = { in: 0, unknown: 1, out: 2 } as const;

/**
 * Rank specialists by the patient's criteria only: network, soonest opening, PMOS experience, distance.
 * Out-of-network offices are dropped when the plan would not cover them.
 * Who pays Attune never enters the ordering (AO 26-15 steering risk; constitution rule 3).
 */
export function rankSpecialists<T extends RankInput>(list: T[], plan: PlanType, limit = 3): RankedMatch<T>[] {
  const eligible = list.filter((s) => isCoverable(plan, s.network));
  const sorted = [...eligible].sort(
    (a, b) =>
      NETWORK_ORDER[a.network] - NETWORK_ORDER[b.network] ||
      (a.soonestDays ?? Number.POSITIVE_INFINITY) - (b.soonestDays ?? Number.POSITIVE_INFINITY) ||
      b.pmosExperience - a.pmosExperience ||
      a.miles - b.miles ||
      a.id.localeCompare(b.id),
  );
  return sorted.slice(0, limit).map((specialist) => ({ specialist, reasons: reasonsFor(specialist) }));
}

function reasonsFor(s: RankInput): string[] {
  const reasons = [s.network === "in" ? "In network" : s.network === "out" ? "Out of network" : "Network not confirmed"];
  reasons.push(s.soonestDays === null ? "Waitlist only" : `Opening in ${s.soonestDays} days`);
  if (s.pmosExperience === 2) reasons.push("Sees PMOS patients often");
  reasons.push(`${s.miles.toFixed(1)} mi`);
  return reasons;
}
