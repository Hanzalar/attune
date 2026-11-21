/**
 * Attune's MCP connector. Claude, ChatGPT or any MCP-capable assistant she connects reads her record through it,
 * journals for her, and drafts updates she approves in the app. The connector URL carries the token from her
 * assistant link; the record it serves is limited to the sections she granted that assistant.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  ASSISTANT_RULES, DEMO_TZ, PRODUCT_NAME, assistantContext, assistantInfo, linkByToken, proposalProblem, todayIn,
  type AssistantLink, type Command, type World,
} from "@attune/domain";
import { Draft, toProposals } from "./drafts";
import { hub } from "./hub";

type Text = { content: { type: "text"; text: string }[]; isError?: boolean };
const say = (text: string, isError = false): Text => ({ content: [{ type: "text", text }], ...(isError ? { isError } : {}) });

type Resolved = { ok: true; w: World; link: AssistantLink; who: string } | { ok: false; error: string };

/** The patient and assistant behind a token, or why the connector can't serve it. */
export function resolveToken(token: string): Resolved {
  const w = hub.world();
  if (!w) return { ok: false, error: `Open ${PRODUCT_NAME} once on this computer so the connector can reach her record.` };
  const link = linkByToken(w, token);
  if (!link) return { ok: false, error: "This connector link was disconnected or never existed. She can reconnect under Care team." };
  const info = assistantInfo(link.assistantId);
  return { ok: true, w, link, who: `${info?.name ?? "Assistant"} (${info?.vendor ?? "connected"})` };
}

export function connectorServer(token: string): McpServer {
  const server = new McpServer({ name: "attune", version: "0.1.0" });

  server.registerTool(
    "read_record",
    {
      title: `Read her ${PRODUCT_NAME} record`,
      description: `Returns the parts of her ${PRODUCT_NAME} health record she chose to share with you (labs, check-in trends, medications, referral and visit, her story, journal), with sources, and the rules you must follow. Call this before answering questions about her health record.`,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      const r = resolveToken(token);
      if (!r.ok) return say(r.error, true);
      const ctx = assistantContext(r.w, r.link.patientId, r.link.assistantId, hub.now(), DEMO_TZ);
      if (ctx.sections.length) hub.enqueue({ by: "assistant", who: r.who, type: "viewRecord", patientId: r.link.patientId, recipientId: r.link.assistantId, sections: ctx.sections });
      return say(`${ASSISTANT_RULES}\n\n${ctx.text}`);
    },
  );

  server.registerTool(
    "write_journal_entry",
    {
      title: `Save to her ${PRODUCT_NAME} journal`,
      description: `Saves what she tells you to journal into her ${PRODUCT_NAME} journal, in her own words. Use it when she asks you to log or journal something. She sees it in the app.`,
      inputSchema: { text: z.string().min(1).max(4000).describe("Her words, as she wants them saved") },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ text }) => {
      const r = resolveToken(token);
      if (!r.ok) return say(r.error, true);
      const cmd: Command = { by: "assistant", who: r.who, type: "writeJournal", patientId: r.link.patientId, text, assistantId: r.link.assistantId };
      hub.enqueue(cmd);
      return say(`Saved to her ${PRODUCT_NAME} journal. It appears in the app within a few seconds.`);
    },
  );

  server.registerTool(
    "suggest_record_updates",
    {
      title: "Draft updates for her to approve",
      description: `Drafts changes to her ${PRODUCT_NAME} record from what she told you: today's check-in scales (1 low to 5 high), medications she started or stopped, notes for her story. Nothing changes until she applies each draft in the app. Never draft a condition, diagnosis or treatment.`,
      inputSchema: { drafts: z.array(Draft).min(1).max(10) },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ drafts }) => {
      const r = resolveToken(token);
      if (!r.ok) return say(r.error, true);
      const patient = r.w.patients.find((p) => p.id === r.link.patientId);
      const proposals = toProposals(drafts, todayIn(hub.now(), DEMO_TZ));
      const problems = proposals.map((p) => proposalProblem(p.proposal, patient?.meds ?? [])).filter((x): x is string => x !== null);
      const kept = proposals.filter((p) => proposalProblem(p.proposal, patient?.meds ?? []) === null);
      if (kept.length) {
        hub.enqueue({ by: "assistant", who: r.who, type: "suggestUpdates", patientId: r.link.patientId, assistantId: r.link.assistantId, proposals: kept });
      }
      const skipped = drafts.length - kept.length;
      return say(
        `Sent ${kept.length} draft${kept.length === 1 ? "" : "s"} to ${PRODUCT_NAME}; she applies or dismisses each in the app.` +
          (skipped ? ` ${skipped} skipped${problems.length ? `: ${problems.join("; ")}` : ""}.` : ""),
      );
    },
  );

  return server;
}
