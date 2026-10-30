import { apply, chooseChannel } from "./referral";
import type { Command, Referral, Specialist } from "./types";

/**
 * The steps Attune takes on its own once a human has approved the step before:
 * deliver after the PCP signs, close the loop after the visit. Everything else waits for a person.
 */
export function agentFollowUp(r: Referral, specialist: Specialist | undefined, at: string): Command | null {
  if (r.stage === "signed" && specialist) return { type: "deliver", by: "agent", at, channel: chooseChannel(specialist) };
  if (r.stage === "visited") return { type: "closeLoop", by: "agent", at };
  return null;
}

/** Apply a human command, then let the agent run any follow-ups it is cleared to do. */
export function dispatch(r: Referral, cmd: Command, specialists: Specialist[], now: () => string): Referral {
  let next = apply(r, cmd);
  for (let i = 0; i < 4; i++) {
    const follow = agentFollowUp(next, specialists.find((s) => s.id === next.specialistId), now());
    if (!follow) break;
    next = apply(next, follow);
  }
  return next;
}
