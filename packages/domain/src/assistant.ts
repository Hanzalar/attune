/**
 * AI assistants (Claude, ChatGPT) as consent recipients. She connects one and picks sections; it reads only those,
 * every read is logged, and anything it writes is a draft she applies or dismisses. The record text an assistant
 * sees is built here, so the in-app journal, the Ask screen and the MCP connector all see exactly the same thing.
 */
import { AI_ASSISTANTS, JOURNAL_CONTEXT_ENTRIES, LOCAL_ASSISTANT, PRODUCT_NAME, type AssistantInfo } from "./config";
import { canSee, grant, revoke } from "./consent";
import { MODE, REFERRAL_STATUS, SECTION, SPECIALTY } from "./labels";
import { localParts } from "./time";
import { trends } from "./views";
import type { CheckIn, Proposal, ProposalRecord, Role, Score, SectionKey, World } from "./types";
import { DomainError, need, patientOf, withPatient } from "./world";

export function assistantInfo(id: string): AssistantInfo | undefined {
  return id === LOCAL_ASSISTANT.id ? LOCAL_ASSISTANT : AI_ASSISTANTS.find((a) => a.id === id);
}

export function activeLink(w: World, patientId: string, assistantId: string) {
  return w.assistants.find((l) => l.patientId === patientId && l.assistantId === assistantId && l.disconnectedAt === null);
}

export function linkByToken(w: World, token: string) {
  return w.assistants.find((l) => l.token === token && l.disconnectedAt === null);
}

/** The record as an assistant may see it right now: only granted sections, every fact with its source. */
export function assistantContext(w: World, patientId: string, assistantId: string, now: string, timeZone: string): { sections: SectionKey[]; text: string } {
  const p = patientOf(w, patientId);
  const local = assistantId === LOCAL_ASSISTANT.id;
  const has = (s: SectionKey) => local || canSee(w, patientId, assistantId, s);
  const today = localParts(now, timeZone).date;
  const lines: string[] = [`${PRODUCT_NAME} record for ${p.firstName} (synthetic demo data). Today is ${today}.`];
  const sections: SectionKey[] = [];
  const add = (s: SectionKey, body: string[]) => {
    if (!has(s)) return;
    sections.push(s);
    lines.push("", `## ${SECTION[s].label}`, ...(body.length ? body : ["Nothing yet."]));
  };

  add("story", p.story ? [
    p.story.words ? `In her words: "${p.story.words}"` : "No story written yet.",
    `Hardest lately: ${p.story.hardest.join(", ") || "-"}. Wants help with: ${p.story.helpWith.join(", ") || "-"}. Has tried: ${p.story.tried.join(", ") || "-"}.`,
  ] : []);
  const t = trends(p.checkIns, today, 14);
  add("trends", p.checkIns.length ? [
    "Patient-logged check-ins, last 14 days. Each scale runs 1 (low end) to 5 (high end).",
    ...p.checkIns.filter((c) => t.dates.includes(c.date)).map((c) => `${c.date}: ${(["mood", "sleep", "energy", "skin"] as const).map((k) => `${k} ${c[k] ?? "-"}`).join(", ")}`),
    `14-day averages: ${t.lines.map((l) => `${l.key} ${l.average ?? "-"}`).join(", ")}.`,
  ] : []);
  add("results", p.results.map((r) => `${r.name}: ${r.value} (lab range ${r.range}), collected ${r.collectedOn}, source: ${r.source}.`));
  add("meds", p.meds.map((m) => `${m.name}, ${m.detail.toLowerCase()}, since ${m.since} (${m.source}).`));
  add("insurance", p.insurance ? [`Plan ${w.plans.find((x) => x.id === p.insurance?.planId)?.name ?? "on file"}, member ID ending ${p.insurance.memberIdLast4}.`] : []);
  add("care", w.referrals.filter((r) => r.patientId === patientId).map((r) => {
    const slot = r.slotId ? w.slots.find((s) => s.id === r.slotId) : undefined;
    const practice = slot ? w.practices.find((x) => x.id === slot.practiceId) : undefined;
    const visit = slot && practice
      ? ` Visit: ${new Date(slot.startsAt).toLocaleString("en-US", { timeZone: practice.timeZone, dateStyle: "medium", timeStyle: "short" })} with ${slot.provider}, ${practice.name}, ${MODE[slot.mode].toLowerCase()}.`
      : "";
    return `${SPECIALTY[r.specialty].label} referral: ${REFERRAL_STATUS[r.status].label}. ${REFERRAL_STATUS[r.status].patient}${visit}`;
  }));
  add("summaries", w.summaries.filter((s) => w.referrals.some((r) => r.id === s.referralId && r.patientId === patientId)).map((s) =>
    `Visit summary from ${w.practices.find((x) => x.id === s.practiceId)?.name ?? "a specialist"} (${s.at.slice(0, 10)}): ${s.text}${s.followUp ? ` Follow-up: ${s.followUp}` : ""}`));
  add("journal", w.journal.filter((j) => j.patientId === patientId).slice(-JOURNAL_CONTEXT_ENTRIES).map((j) => `${j.at.slice(0, 10)}: ${j.text}`));

  const withheld = (["story", "trends", "results", "meds", "insurance", "care", "summaries", "journal"] as const).filter((s) => !has(s));
  if (withheld.length) lines.push("", `Not shared with you: ${withheld.map((s) => SECTION[s].label).join(", ")}.`);
  return { sections, text: lines.join("\n") };
}

const isScore = (v: unknown): v is Score => typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5;

/** Why a drafted change can't be kept, or null when it's fine. LLM output is checked like any other input. */
export function proposalProblem(p: Proposal, meds: { name: string }[]): string | null {
  switch (p.kind) {
    case "checkIn": {
      const scores = [p.mood, p.sleep, p.energy, p.skin].filter((v) => v !== undefined);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date)) return "check-in date isn't a date";
      if (scores.length === 0 || !scores.every(isScore)) return "check-in scores must be 1 to 5";
      return null;
    }
    case "addMed":
      return p.name.trim().length > 0 && p.name.length <= 80 ? null : "medication name is missing";
    case "stopMed":
      return meds.some((m) => m.name.toLowerCase() === p.name.toLowerCase()) ? null : `${p.name} isn't on her list`;
    case "storyNote":
      return p.text.trim().length > 0 && p.text.length <= 600 ? null : "story note is empty or too long";
  }
}

/** "Wed, Nov 18" for a YYYY-MM-DD calendar date. */
function dayLabel(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? date : new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" }).format(d);
}

export function describeProposal(p: Proposal): string {
  switch (p.kind) {
    case "checkIn":
      return `Check-in for ${dayLabel(p.date)}: ${(["mood", "sleep", "energy", "skin"] as const).filter((k) => p[k] !== undefined).map((k) => `${k} ${p[k]} of 5`).join(", ")}`;
    case "addMed": return `Add ${p.name}${p.detail ? ` (${p.detail})` : ""} to your medications`;
    case "stopMed": return `Mark ${p.name} as stopped`;
    case "storyNote": return `Add to your story: "${p.text}"`;
  }
}

export type AssistantBody =
  | { type: "connectAssistant"; patientId: string; assistantId: string; sections: SectionKey[]; token: string }
  | { type: "disconnectAssistant"; patientId: string; assistantId: string }
  | { type: "writeJournal"; patientId: string; text: string; assistantId: string | null }
  | { type: "assistantReply"; patientId: string; assistantId: string; entryId: string | null; reply: string; proposals: { proposal: Proposal; why: string }[] }
  | { type: "applyProposal"; proposalId: string }
  | { type: "dismissProposal"; proposalId: string };

type Log = (next: World, summary: string, patientId: string | null, shared?: { recipientId: string; sections: SectionKey[] }) => World;

function requireLink(w: World, patientId: string, assistantId: string, by: Role) {
  if (assistantId === LOCAL_ASSISTANT.id) {
    need(by === "agent", "Demo replies come from Attune itself.");
    return;
  }
  need(by === "assistant", "Only a connected assistant can do this.");
  need(activeLink(w, patientId, assistantId), `${assistantInfo(assistantId)?.name ?? "That assistant"} isn't connected. She can connect it under Care team.`);
}

function applyChange(w: World, r: ProposalRecord, now: string): World {
  const p = patientOf(w, r.patientId);
  const via = assistantInfo(r.by)?.name ?? "an assistant";
  const pr = r.proposal;
  switch (pr.kind) {
    case "checkIn": {
      const existing = p.checkIns.find((c) => c.date === pr.date);
      const merged: CheckIn = { ...existing, date: pr.date };
      for (const k of ["mood", "sleep", "energy", "skin"] as const) if (pr[k] !== undefined) merged[k] = pr[k];
      const checkIns = [...p.checkIns.filter((c) => c.date !== pr.date), merged].sort((a, b) => a.date.localeCompare(b.date));
      return withPatient(w, p.id, { checkIns });
    }
    case "addMed":
      return withPatient(w, p.id, { meds: [...p.meds, { name: pr.name.trim(), detail: pr.detail.trim() || "As she described", since: now.slice(0, 7), source: `Patient-reported via ${via}` }] });
    case "stopMed":
      return withPatient(w, p.id, { meds: p.meds.filter((m) => m.name.toLowerCase() !== pr.name.toLowerCase()) });
    case "storyNote": {
      const story = p.story ?? { hardest: [], helpWith: [], tried: [], words: "" };
      return withPatient(w, p.id, { story: { ...story, words: [story.words, pr.text.trim()].filter(Boolean).join("\n\n") } });
    }
  }
}

/** Assistant and journal commands. Called from `run` with the same audit logger as every other command. */
export function applyAssistantCommand(w: World, c: AssistantBody & { by: Role; who: string }, now: string, log: Log): World {
  switch (c.type) {
    case "connectAssistant": {
      need(c.by === "patient", "Only she can connect an assistant.");
      const info = AI_ASSISTANTS.find((a) => a.id === c.assistantId);
      need(info, "That assistant isn't supported.");
      need(c.sections.length > 0, "Pick at least one part of your record to share.");
      need(c.token.length >= 24, "Connection token is too short.");
      need(!activeLink(w, c.patientId, c.assistantId), `${info.name} is already connected.`);
      const g = grant(w, c.patientId, c.assistantId, c.sections, now, "assistant");
      const link = { assistantId: c.assistantId, patientId: c.patientId, token: c.token, connectedAt: now, disconnectedAt: null };
      return log({ ...w, consents: g.consents, assistants: [...w.assistants, link] }, `Patient connected ${info.name} (${info.vendor})`, c.patientId, {
        recipientId: c.assistantId,
        sections: c.sections,
      });
    }
    case "disconnectAssistant": {
      need(c.by === "patient", "Only she can disconnect an assistant.");
      need(activeLink(w, c.patientId, c.assistantId), "That assistant isn't connected.");
      let consents = w.consents;
      for (const s of new Set(w.consents.filter((x) => x.patientId === c.patientId && x.recipientId === c.assistantId && x.revokedAt === null).map((x) => x.section))) {
        consents = revoke({ ...w, consents }, c.patientId, c.assistantId, s, now);
      }
      const assistants = w.assistants.map((l) => (l.patientId === c.patientId && l.assistantId === c.assistantId && l.disconnectedAt === null ? { ...l, disconnectedAt: now } : l));
      return log({ ...w, consents, assistants }, `Patient disconnected ${assistantInfo(c.assistantId)?.name}; its access and connector link ended`, c.patientId);
    }
    case "writeJournal": {
      const text = c.text.trim();
      need(text.length > 0, "Write something first.");
      need(text.length <= 4000, "That entry is too long for one note. Split it in two.");
      if (c.assistantId) requireLink(w, c.patientId, c.assistantId, c.by);
      else need(c.by === "patient", "Only she writes in her own journal.");
      const entry = { id: `j-${w.journal.length + 1}`, patientId: c.patientId, at: now, text, source: c.assistantId ?? "patient", reply: null, replyBy: null };
      const from = c.assistantId ? ` through ${assistantInfo(c.assistantId)?.name}` : "";
      return log({ ...w, journal: [...w.journal, entry] }, `Patient wrote a journal entry${from}`, c.patientId);
    }
    case "assistantReply": {
      requireLink(w, c.patientId, c.assistantId, c.by);
      const p = patientOf(w, c.patientId);
      const kept = c.proposals.filter((x) => proposalProblem(x.proposal, p.meds) === null);
      const dropped = c.proposals.length - kept.length;
      const records: ProposalRecord[] = kept.map((x, i) => ({
        id: `d-${w.proposals.length + i + 1}`, patientId: c.patientId, entryId: c.entryId, by: c.assistantId, at: now,
        proposal: x.proposal, why: x.why.slice(0, 280), status: "pending", decidedAt: null,
      }));
      const journal = c.entryId ? w.journal.map((j) => (j.id === c.entryId ? { ...j, reply: c.reply.trim().slice(0, 600) || null, replyBy: c.assistantId } : j)) : w.journal;
      const name = assistantInfo(c.assistantId)?.name;
      return log({ ...w, journal, proposals: [...w.proposals, ...records] },
        `${name} drafted ${records.length} update${records.length === 1 ? "" : "s"} for her to review${dropped ? `; ${dropped} invalid draft${dropped === 1 ? "" : "s"} dropped` : ""}`, c.patientId);
    }
    case "applyProposal":
    case "dismissProposal": {
      need(c.by === "patient", "Only she decides what changes in her record.");
      const r = w.proposals.find((x) => x.id === c.proposalId);
      need(r, "That suggestion was not found.");
      if (r.status !== "pending") throw new DomainError("That suggestion was already handled.");
      const decided = { ...w, proposals: w.proposals.map((x) => (x.id === r.id ? { ...x, status: c.type === "applyProposal" ? ("applied" as const) : ("dismissed" as const), decidedAt: now } : x)) };
      if (c.type === "dismissProposal") return log(decided, `Patient dismissed a suggestion from ${assistantInfo(r.by)?.name}`, r.patientId);
      const problem = proposalProblem(r.proposal, patientOf(w, r.patientId).meds);
      need(problem === null, `Can't apply: ${problem}.`);
      return log(applyChange(decided, r, now), `Patient applied ${assistantInfo(r.by)?.name}'s suggestion: ${describeProposal(r.proposal)}`, r.patientId);
    }
  }
}
