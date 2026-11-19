/**
 * The assistant, from the app's side. When Attune's gateway is running with Claude credentials and she has connected
 * Claude, journal entries and questions go to Claude with only the sections she shared. Otherwise the in-browser
 * demo replies answer, labelled as such, and nothing leaves her device. Either way, drafts come back as commands she
 * applies herself, and every read by Claude is logged as a view of her record.
 */
import { useEffect, useState } from "react";
import {
  AI_ASSISTANTS, DEMO_PEOPLE, DEMO_TZ, LOCAL_ASSISTANT, activeLink, assistantContext, demoAnswer, demoJournal, todayIn,
  type Proposal, type SectionKey, type World,
} from "@attune/domain";
import { act, nowIso } from "./store";

const API = `${import.meta.env.VITE_ASSISTANT_URL ?? ""}/api/assistant`;
export const CLAUDE = AI_ASSISTANTS.find((a) => a.id === "ai-claude") ?? AI_ASSISTANTS[0]!;

export interface GatewayStatus {
  /** The gateway answered. */
  reachable: boolean;
  /** It has working Claude credentials. */
  ready: boolean;
  model: string | null;
  reason: string | null;
}

let cached: GatewayStatus | null = null;

export async function gatewayStatus(): Promise<GatewayStatus> {
  if (cached) return cached;
  try {
    const res = await fetch(`${API}/health`);
    const body = res.ok ? ((await res.json()) as Omit<GatewayStatus, "reachable">) : null;
    cached = body ? { reachable: true, ...body } : { reachable: false, ready: false, model: null, reason: "The assistant gateway isn't running." };
  } catch {
    cached = { reachable: false, ready: false, model: null, reason: "The assistant gateway isn't running." };
  }
  return cached;
}

export function useGatewayStatus(): GatewayStatus | null {
  const [status, setStatus] = useState<GatewayStatus | null>(cached);
  useEffect(() => {
    let live = true;
    void gatewayStatus().then((s) => live && setStatus(s));
    return () => {
      live = false;
    };
  }, []);
  return status;
}

export type Engine = { kind: "claude"; model: string } | { kind: "demo"; why: string };

/** Which engine answers right now, and why. Claude only when the gateway is ready and she connected Claude. */
export function engineFor(w: World, patientId: string, status: GatewayStatus | null): Engine {
  if (status?.ready && activeLink(w, patientId, CLAUDE.id)) return { kind: "claude", model: status.model ?? "Claude" };
  if (!activeLink(w, patientId, CLAUDE.id)) return { kind: "demo", why: "Claude isn't connected. Connect it under Care team to use it here." };
  return { kind: "demo", why: status?.reason ?? "The assistant gateway isn't running." };
}

const CLAUDE_ACTOR = { by: "assistant" as const, who: `${CLAUDE.name} (${CLAUDE.vendor})` };
const LOCAL_ACTOR = { by: "agent" as const, who: "Attune" };

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}/${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const json = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(json.error ?? `The assistant gateway returned ${res.status}.`);
  return json;
}

/** Log Claude's read of her record, so it shows under "Who viewed your record". */
function logRead(w: World, patientId: string, sections: SectionKey[]) {
  if (sections.length) act({ ...CLAUDE_ACTOR, type: "viewRecord", patientId, recipientId: CLAUDE.id, sections });
}

/**
 * Save a journal entry and get the assistant's reply and drafts. Returns an error message to show, or null.
 * The entry is saved first, so nothing she wrote is lost if the assistant fails.
 */
export async function journal(w: World, patientId: string, text: string, status: GatewayStatus | null): Promise<string | null> {
  const saved = act({ by: "patient", who: DEMO_PEOPLE.patient, type: "writeJournal", patientId, text, assistantId: null });
  if (saved) return saved;
  const entryId = `j-${w.journal.length + 1}`;
  const now = nowIso();
  const today = todayIn(now, DEMO_TZ);
  const engine = engineFor(w, patientId, status);
  try {
    if (engine.kind === "claude") {
      const ctx = assistantContext(w, patientId, CLAUDE.id, now, DEMO_TZ);
      const out = await post<{ reply: string; proposals: { proposal: Proposal; why: string }[] }>("journal", { context: ctx.text, entry: text, today });
      logRead(w, patientId, ctx.sections);
      return act({ ...CLAUDE_ACTOR, type: "assistantReply", patientId, assistantId: CLAUDE.id, entryId, reply: out.reply, proposals: out.proposals });
    }
    const p = w.patients.find((x) => x.id === patientId);
    const out = demoJournal(text, today, p?.meds ?? []);
    return act({ ...LOCAL_ACTOR, type: "assistantReply", patientId, assistantId: LOCAL_ASSISTANT.id, entryId, reply: out.reply, proposals: out.proposals });
  } catch (err) {
    return `Saved to your journal. ${err instanceof Error ? err.message : "The assistant didn't answer."}`;
  }
}

export interface Answer {
  text: string;
  by: string;
  demo: boolean;
  sections: SectionKey[];
}

/** Ask about her record. Claude sees only shared sections; demo replies read the same sections on-device. */
export async function ask(w: World, patientId: string, question: string, history: { role: "user" | "assistant"; text: string }[], status: GatewayStatus | null): Promise<Answer> {
  const now = nowIso();
  const engine = engineFor(w, patientId, status);
  if (engine.kind === "claude") {
    const ctx = assistantContext(w, patientId, CLAUDE.id, now, DEMO_TZ);
    const out = await post<{ answer: string }>("ask", { context: ctx.text, question, history });
    logRead(w, patientId, ctx.sections);
    return { text: out.answer, by: CLAUDE.name, demo: false, sections: ctx.sections };
  }
  const shared = activeLink(w, patientId, CLAUDE.id) ? assistantContext(w, patientId, CLAUDE.id, now, DEMO_TZ).sections : assistantContext(w, patientId, LOCAL_ASSISTANT.id, now, DEMO_TZ).sections;
  const out = demoAnswer(w, patientId, question, now, DEMO_TZ, shared);
  return { text: out.answer, by: LOCAL_ASSISTANT.name, demo: true, sections: out.sections };
}

/** A connector token: random, URL-safe, made in the browser and kept in her record's assistant link. */
export function newToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Where the gateway listens when run locally (`npm run assistant`). Override with VITE_CONNECTOR_BASE. */
const LOCAL_GATEWAY = "http://localhost:8787";

/** The MCP connector URL an assistant uses. Shown once she connects it. */
export function connectorUrl(token: string): string {
  return `${import.meta.env.VITE_CONNECTOR_BASE ?? LOCAL_GATEWAY}/mcp/${token}`;
}
