/**
 * Attune assistant gateway. One small Node server:
 *   /api/assistant/*  in-app Claude for the journal and Ask screens (local app only)
 *   /api/hub/*        record sync between the app and connected assistants (local app only)
 *   /mcp/<token>      the MCP connector for Claude, ChatGPT or any MCP client (token required)
 * App endpoints answer only requests addressed to localhost, so exposing the server through a tunnel for a remote
 * assistant exposes the token-guarded connector and nothing else. Prototype: synthetic data only (ADR-007).
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import type { World } from "@attune/domain";
import { GatewayError, askRecord, claudeHealth, explain, journalReply } from "./claude";
import { hub } from "./hub";
import { connectorServer, resolveToken } from "./mcp";

const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? "127.0.0.1";
const LIMIT = 4_000_000;

const JournalIn = z.object({ context: z.string().max(200_000), entry: z.string().min(1).max(4000), today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });
const AskIn = z.object({
  context: z.string().max(200_000),
  question: z.string().min(1).max(2000),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(8000) })).max(40),
});
const AckIn = z.object({ results: z.array(z.object({ id: z.string(), error: z.string().nullable() })) });

async function body(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > LIMIT) throw new GatewayError(413, "Request too large.");
    chunks.push(chunk as Buffer);
  }
  if (!chunks.length) return undefined;
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new GatewayError(400, "Request body isn't JSON.");
  }
}

function send(res: ServerResponse, status: number, payload?: unknown) {
  res.writeHead(status, payload === undefined ? {} : { "content-type": "application/json" });
  res.end(payload === undefined ? undefined : JSON.stringify(payload));
}

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const out = schema.safeParse(value);
  if (!out.success) throw new GatewayError(400, `Invalid request: ${out.error.issues.map((i) => i.path.join(".") || i.message).join(", ")}.`);
  return out.data;
}

/** App endpoints are for the app on this machine. A tunnel forwards a public Host, which is refused here. */
function local(req: IncomingMessage): boolean {
  const host = (req.headers.host ?? "").split(":")[0];
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

async function connector(req: IncomingMessage, res: ServerResponse, token: string) {
  if (!resolveToken(token).ok) return send(res, 404, { error: "Unknown connector link." });
  const server = connectorServer(token);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on("close", () => {
    void transport.close();
    void server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.method === "POST" ? await body(req) : undefined);
}

async function route(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", "http://localhost");
  const path = url.pathname;
  const mcp = path.match(/^\/mcp\/([0-9a-f]{24,})\/?$/);
  if (mcp?.[1]) return connector(req, res, mcp[1]);
  if (!path.startsWith("/api/")) return send(res, 404, { error: "Not found." });
  if (!local(req)) return send(res, 403, { error: "App endpoints are only available on this computer." });

  const key = `${req.method} ${path}`;
  switch (key) {
    case "GET /api/assistant/health":
      return send(res, 200, await claudeHealth());
    case "POST /api/assistant/journal": {
      const b = parse(JournalIn, await body(req));
      return send(res, 200, await journalReply(b.context, b.entry, b.today));
    }
    case "POST /api/assistant/ask": {
      const b = parse(AskIn, await body(req));
      return send(res, 200, { answer: await askRecord(b.context, b.question, b.history) });
    }
    case "PUT /api/hub/world": {
      const w = (await body(req)) as World | undefined;
      if (!w || w.schema !== 4) throw new GatewayError(400, "Unsupported record format.");
      hub.setWorld(w);
      return send(res, 204);
    }
    case "GET /api/hub/inbox":
      return send(res, 200, { items: hub.pending() });
    case "POST /api/hub/ack":
      hub.ack(parse(AckIn, await body(req)).results);
      return send(res, 204);
    default:
      return send(res, 404, { error: "Not found." });
  }
}

createServer((req, res) => {
  route(req, res).catch((err: unknown) => {
    const e = explain(err);
    if (e.status >= 500) console.error("[gateway]", err);
    if (!res.headersSent) send(res, e.status, { error: e.message });
  });
}).listen(PORT, HOST, () => {
  console.log(`Attune assistant gateway on http://${HOST}:${PORT} (connector: /mcp/<token>)`);
});
