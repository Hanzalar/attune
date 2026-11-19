/**
 * In-app Claude for the journal and Ask screens. One Messages API call per request: her consented record goes in the
 * system prompt after the shared rules, and her words go in the user turn. We host this call (not Managed Agents)
 * because it carries health data and keeps no session history.
 *
 * Model: Claude Opus 5.5 at low effort (short, chat-like turns). Server-side fallbacks are on, so a safety decline is
 * retried on another model in the same call; a refusal that survives that is answered plainly.
 */
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { ASSISTANT_RULES, type Proposal } from "@attune/domain";
import { Draft, toProposals } from "./drafts";

export const MODEL = "claude-opus-5-5";
const FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

let client: Anthropic | null = null;
const claude = () => (client ??= new Anthropic());

function system(context: string): Anthropic.Beta.BetaTextBlockParam[] {
  return [
    { type: "text", text: ASSISTANT_RULES },
    { type: "text", text: context, cache_control: { type: "ephemeral" } },
  ];
}

const JournalOut = z.object({
  reply: z.string().describe("One or two warm, plain sentences acknowledging what she wrote. No advice."),
  drafts: z.array(Draft).describe("Record updates for things she clearly said. Empty when there are none."),
});

export async function journalReply(context: string, entry: string, today: string): Promise<{ reply: string; proposals: { proposal: Proposal; why: string }[] }> {
  const res = await claude().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    ...FALLBACK,
    output_config: { effort: "low", format: betaZodOutputFormat(JournalOut) },
    system: system(context),
    messages: [{ role: "user", content: `Today is ${today}. She just wrote this in her journal:\n\n${entry}` }],
  });
  if (res.stop_reason === "refusal") return { reply: "It's saved in your journal. I can't draft anything from this one.", proposals: [] };
  const out = res.parsed_output;
  if (!out) throw new GatewayError(502, "Claude's reply couldn't be read. Your entry is saved.");
  return { reply: out.reply, proposals: toProposals(out.drafts, today) };
}

export type Turn = { role: "user" | "assistant"; text: string };

export async function askRecord(context: string, question: string, history: Turn[]): Promise<string> {
  const res = await claude().beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    ...FALLBACK,
    output_config: { effort: "low" },
    system: system(context),
    messages: [...history.map((t) => ({ role: t.role, content: t.text })), { role: "user" as const, content: question }],
  });
  if (res.stop_reason === "refusal") return "I can't help with that here. Your care team is the right place to ask.";
  const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n").trim();
  if (!text) throw new GatewayError(502, "Claude didn't return an answer. Try asking again.");
  return text;
}

export class GatewayError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Map SDK errors to a status and a sentence a patient can act on. Most specific first. */
export function explain(err: unknown): GatewayError {
  if (err instanceof GatewayError) return err;
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) return new GatewayError(503, "Claude's credentials on this gateway were rejected.");
  if (err instanceof Anthropic.NotFoundError) return new GatewayError(503, `This account can't use ${MODEL}.`);
  if (err instanceof Anthropic.RateLimitError) return new GatewayError(429, "Claude is busy right now. Try again in a minute.");
  if (err instanceof Anthropic.APIConnectionError) return new GatewayError(503, "The gateway can't reach the Claude API.");
  if (err instanceof Anthropic.APIError) return new GatewayError(502, `Claude returned an error (${err.status ?? "unknown"}).`);
  return new GatewayError(500, "The assistant gateway hit an unexpected error.");
}

const NO_CREDENTIALS = "No Claude credentials on this gateway. Run `ant auth login` or set ANTHROPIC_API_KEY, then restart it.";

let health: { at: number; ready: boolean; reason: string | null } | null = null;

/** Whether Claude is usable from here. Checked with a free model lookup, cached for a minute. */
export async function claudeHealth(): Promise<{ ready: boolean; model: string; reason: string | null }> {
  if (!health || Date.now() - health.at > 60_000) {
    try {
      await claude().models.retrieve(MODEL);
      health = { at: Date.now(), ready: true, reason: null };
    } catch (err) {
      // A failure before any request leaves (not an API or connection error) means the SDK found no credentials.
      const e = explain(err);
      health = { at: Date.now(), ready: false, reason: e.status === 500 ? NO_CREDENTIALS : e.message };
    }
  }
  return { ready: health.ready, model: MODEL, reason: health.reason };
}
