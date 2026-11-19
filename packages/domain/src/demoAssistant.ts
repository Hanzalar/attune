/**
 * Demo replies: a rules-based stand-in for the assistant, used when no model is reachable (the public demo has no
 * gateway). It runs in the browser, so nothing leaves her device, and every reply is labelled as not coming from an
 * AI model. It follows the same rules as the real assistant: facts with sources, drafts only, never a diagnosis.
 */
import { CHECKIN_SCALES } from "./labels";
import { streak, trends } from "./views";
import { localParts } from "./time";
import type { Med, Proposal, Score, SectionKey, World } from "./types";
import { patientOf } from "./world";

type Draft = { proposal: Proposal; why: string };

const SCALES: { key: "mood" | "sleep" | "energy" | "skin"; topic: RegExp; low: RegExp; high: RegExp }[] = [
  { key: "sleep", topic: /\b(slept|sleep|sleeping|insomnia|woke|awake|nap)\b/i, low: /\b(badly|terribl[ey]|awful(ly)?|barely|poor(ly)?|rough|restless|couldn'?t|3 ?am|again)\b/i, high: /\b(well|great|solid|rested|deep|through the night)\b/i },
  { key: "mood", topic: /\b(mood|anxious|anxiety|down|sad|low|flat|irritable|happy|calm|stressed|overwhelmed|cried|teary)\b/i, low: /\b(anxious|anxiety|down|sad|low|flat|irritable|stressed|overwhelmed|cried|teary)\b/i, high: /\b(happy|calm|good mood|lighter|better)\b/i },
  { key: "energy", topic: /\b(energy|tired|exhausted|drained|fatigue|wiped|sluggish|energetic)\b/i, low: /\b(tired|exhausted|drained|fatigue|wiped|sluggish|no energy)\b/i, high: /\b(energetic|lots of energy|good energy)\b/i },
  { key: "skin", topic: /\b(skin|acne|breakout|broke out|flare|pimples?|clear)\b/i, low: /\b(acne|breakout|broke out|flare|pimples?)\b/i, high: /\b(clear|calm skin|cleared)\b/i },
];
const SEVERE = /\b(terribl[ey]|awful(ly)?|barely|exhausted|wiped|no energy|couldn'?t sleep)\b/i;
const STOP = new Set(["to", "a", "my", "the", "feeling", "taking", "on", "it", "work", "again", "being", "that"]);

function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
}

/** Draft updates from a journal entry. Only what she clearly said: today's scales, meds started or stopped. */
export function demoJournal(text: string, today: string, meds: Med[]): { reply: string; proposals: Draft[] } {
  const drafts: Draft[] = [];
  const scores: Partial<Record<"mood" | "sleep" | "energy" | "skin", Score>> = {};
  const why: string[] = [];
  for (const s of sentences(text)) {
    for (const scale of SCALES) {
      if (scores[scale.key] !== undefined || !scale.topic.test(s)) continue;
      const score: Score | null = scale.low.test(s) ? (SEVERE.test(s) ? 1 : 2) : scale.high.test(s) ? 4 : null;
      if (score !== null) {
        scores[scale.key] = score;
        if (!why.includes(s)) why.push(s);
      }
    }
    const started = s.match(/\b(?:started|starting|began|was prescribed)\s+(?:taking\s+)?([A-Za-z][A-Za-z-]{2,})/i);
    if (started?.[1] && !STOP.has(started[1].toLowerCase())) {
      const name = started[1][0]?.toUpperCase() + started[1].slice(1).toLowerCase();
      if (!meds.some((m) => m.name.toLowerCase().includes(name.toLowerCase()))) drafts.push({ proposal: { kind: "addMed", name, detail: "Started recently" }, why: s });
    }
    const stopped = s.match(/\b(?:stopped|quit|came off)\s+(?:taking\s+)?(?:my\s+)?([A-Za-z][A-Za-z-]{2,})/i);
    const word = stopped?.[1]?.toLowerCase();
    const med = word ? meds.find((m) => m.name.toLowerCase().includes(word)) : undefined;
    if (med) drafts.push({ proposal: { kind: "stopMed", name: med.name }, why: s });
    if (/\b(i want to ask|ask (my|the) doctor|remember to ask|i'?d like (to|my))\b/i.test(s)) drafts.push({ proposal: { kind: "storyNote", text: s }, why: s });
  }
  if (Object.keys(scores).length) drafts.unshift({ proposal: { kind: "checkIn", date: today, ...scores }, why: why.join(" ") });
  const reply = drafts.length
    ? `Noted, and thank you for writing it down. I drafted ${drafts.length} update${drafts.length === 1 ? "" : "s"} from it; nothing changes until you apply ${drafts.length === 1 ? "it" : "them"}.`
    : "Noted. It's in your journal, just for you.";
  return { reply, proposals: drafts };
}

function rangeNote(value: string, range: string): string {
  const v = Number.parseFloat(value);
  const m = range.match(/([\d.]+)\s*[–-]\s*([\d.]+)/);
  if (Number.isNaN(v) || !m) return "";
  const [lo, hi] = [Number(m[1]), Number(m[2])];
  return v < lo || v > hi ? ", outside the range the lab printed" : ", inside the range the lab printed";
}

/** Answer a question from the sections she shares. Facts with sources; anything about meaning goes to her care team. */
export function demoAnswer(w: World, patientId: string, question: string, now: string, timeZone: string, shared: readonly SectionKey[]): { answer: string; sections: SectionKey[] } {
  const p = patientOf(w, patientId);
  const q = question.toLowerCase();
  const has = (s: SectionKey) => shared.includes(s);
  const today = localParts(now, timeZone).date;
  const care = " What it means for you is a question for your care team; I can't interpret it.";
  const notShared = (label: string) => ({ answer: `You haven't shared ${label} with the assistant. You can turn it on under Care team.`, sections: [] as SectionKey[] });

  if (/\b(lab|labs|a1c|tsh|testosterone|prolactin|result|results|blood)\b/.test(q)) {
    if (!has("results")) return notShared("labs and results");
    if (!p.results.length) return { answer: "There are no results in your record yet.", sections: ["results"] };
    const asked = p.results.filter((r) => q.includes(r.name.toLowerCase()));
    const list = (asked.length ? asked : p.results).map((r) => `${r.name} ${r.value} on ${r.collectedOn} (lab range ${r.range}${rangeNote(r.value, r.range)}), from ${r.source}`);
    return { answer: `${list.join("; ")}.${care}`, sections: ["results"] };
  }
  if (/\b(sleep|mood|energy|skin|check-?ins?|stats|week|trend|trends|how have i)\b/.test(q)) {
    if (!has("trends")) return notShared("your check-ins");
    const t = trends(p.checkIns, today, 7);
    const parts = t.lines.filter((l) => l.average !== null).map((l) => `${CHECKIN_SCALES[l.key].label.toLowerCase()} ${l.average} of 5`);
    const days = t.lines[0]?.points.filter((x) => x !== null).length ?? 0;
    return {
      answer: parts.length
        ? `Over the last 7 days you checked in ${days} time${days === 1 ? "" : "s"}. Your averages: ${parts.join(", ")} (1 is the low end, 5 the high end). Current streak: ${streak(p.checkIns, today)} days. Source: your check-ins.`
        : "You haven't checked in this week yet.",
      sections: ["trends"],
    };
  }
  if (/\b(visit|appointment|booked|when|referral|waitlist)\b/.test(q)) {
    if (!has("care")) return notShared("your referrals and visits");
    const r = w.referrals.filter((x) => x.patientId === patientId).at(-1);
    const slot = r?.slotId ? w.slots.find((s) => s.id === r.slotId) : undefined;
    const practice = slot ? w.practices.find((x) => x.id === slot.practiceId) : undefined;
    if (!r) return { answer: "You don't have a referral yet.", sections: ["care"] };
    const when = slot && practice ? ` Your visit is ${new Date(slot.startsAt).toLocaleString("en-US", { timeZone: practice.timeZone, weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })} with ${slot.provider} at ${practice.name}.` : "";
    return { answer: `Your referral status: ${r.status.replace(/_/g, " ")}.${when} Source: your referral in Attune.`, sections: ["care"] };
  }
  if (/\b(pack|dossier|specialist see|what do they see|what did i share)\b/.test(q)) {
    const holders = [...new Set(w.consents.filter((c) => c.patientId === patientId && c.via === "offer" && c.revokedAt === null).map((c) => c.recipientId))];
    const names = holders.map((id) => w.practices.find((x) => x.id === id)?.name ?? id);
    return {
      answer: `Your Patient Pack has your story, check-in trends, labs and results, medications and insurance, plus your PCP's referral note. ${names.length ? `It's shared with ${names.join(", ")}.` : "No specialist has it yet; it's shared only when you accept a visit."} You can preview it from your record.`,
      sections: ["care"],
    };
  }
  if (/\b(med|meds|medication|medications|taking)\b/.test(q)) {
    if (!has("meds")) return notShared("your medications");
    return { answer: p.meds.length ? `On your list: ${p.meds.map((m) => `${m.name} (${m.source.toLowerCase()})`).join("; ")}.` : "No medications on your list.", sections: ["meds"] };
  }
  return {
    answer: "I can answer from your record: your labs and results, check-in trends, medications, referral and visit, and your Patient Pack. Try “How did I sleep this week?” or “What was my last A1c?”",
    sections: [],
  };
}
