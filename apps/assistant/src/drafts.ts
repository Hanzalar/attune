/**
 * The shape assistants use to draft record updates through the connector's suggest_record_updates tool. Every draft
 * still passes the domain's own checks before she sees it.
 */
import { z } from "zod";
import type { Proposal, Score } from "@attune/domain";

/** Flat, all-fields-present shape: simple for any assistant to fill in, with no unions to get wrong. */
export const Draft = z.object({
  kind: z.enum(["checkIn", "addMed", "stopMed", "storyNote"]).describe("checkIn: today's 1-5 scales; addMed/stopMed: a medication she said she started or stopped; storyNote: something she wants in her story"),
  why: z.string().describe("Her exact words this draft comes from"),
  date: z.string().nullable().describe("checkIn only: YYYY-MM-DD"),
  mood: z.number().int().nullable(),
  sleep: z.number().int().nullable(),
  energy: z.number().int().nullable(),
  skin: z.number().int().nullable(),
  name: z.string().nullable().describe("addMed/stopMed: the medication name as she wrote it"),
  detail: z.string().nullable().describe("addMed: how she takes it, in her words"),
  text: z.string().nullable().describe("storyNote: the note, in her words"),
});
export type DraftT = z.infer<typeof Draft>;

const score = (n: number | null): Score | undefined => (n !== null && Number.isInteger(n) && n >= 1 && n <= 5 ? (n as Score) : undefined);

/** Turn a draft into a domain proposal, or null when the draft is missing what its kind needs. */
export function toProposal(d: DraftT, today: string): Proposal | null {
  switch (d.kind) {
    case "checkIn": {
      const p: Proposal = { kind: "checkIn", date: d.date ?? today };
      const scales = { mood: score(d.mood), sleep: score(d.sleep), energy: score(d.energy), skin: score(d.skin) };
      for (const [k, v] of Object.entries(scales) as [keyof typeof scales, Score | undefined][]) if (v !== undefined) p[k] = v;
      return Object.keys(p).length > 2 ? p : null;
    }
    case "addMed":
      return d.name ? { kind: "addMed", name: d.name, detail: d.detail ?? "" } : null;
    case "stopMed":
      return d.name ? { kind: "stopMed", name: d.name } : null;
    case "storyNote":
      return d.text ? { kind: "storyNote", text: d.text } : null;
  }
}

export function toProposals(drafts: DraftT[], today: string): { proposal: Proposal; why: string }[] {
  return drafts.flatMap((d) => {
    const proposal = toProposal(d, today);
    return proposal ? [{ proposal, why: d.why }] : [];
  });
}
