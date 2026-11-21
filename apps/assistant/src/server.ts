/**
 * Attune connector gateway. One small Node server:
 *   /mcp/<token>  the MCP connector for Claude, ChatGPT or any MCP client she connects (token required)
 *   /api/hub/*    record sync between the app and connected assistants (local app only)
 * The conversation happens in her assistant's own app; this server never calls a model. App endpoints answer only
 * requests addressed to localhost, so exposing the server through a tunnel exposes the token-guarded connector and
 * nothing else. Prototype: synthetic data only (ADR-007).
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import type { World } from "@attune/domain";
import { hub } from "./hub";
import { connectorServer, resolveToken } from "./mcp";

class GatewayError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? "127.0.0.1";
const LIMIT = 4_000_000;

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
    const e = err instanceof GatewayError ? err : new GatewayError(500, "The connector gateway hit an unexpected error.");
    if (e.status >= 500) console.error("[gateway]", err);
    if (!res.headersSent) send(res, e.status, { error: e.message });
  });
}).listen(PORT, HOST, () => {
  console.log(`Attune connector gateway on http://${HOST}:${PORT} (connector: /mcp/<token>)`);
});
