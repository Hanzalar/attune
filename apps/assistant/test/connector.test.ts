/**
 * The connector over real HTTP: start the gateway, push a record the way the app does, and drive it with the official
 * MCP client, as Claude or ChatGPT would. No model is involved: the assistant on the other end does the talking.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { request } from "node:http";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ASSISTANT_DEFAULT_SECTIONS, DEMO_IDS, demoWorld, run, type Command, type World } from "@attune/domain";

const PORT = 18_787;
const BASE = `http://127.0.0.1:${PORT}`;
const TOKEN = "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718";
const root = fileURLToPath(new URL("../../..", import.meta.url));
let gateway: ChildProcess;

function world(): World {
  const now = new Date().toISOString();
  return run(demoWorld(now, "fill"), {
    by: "patient", who: "Ari (example)", type: "connectAssistant", patientId: DEMO_IDS.patient, assistantId: "ai-claude",
    sections: ASSISTANT_DEFAULT_SECTIONS.filter((s) => s !== "meds"), token: TOKEN,
  }, now);
}

async function client(token = TOKEN): Promise<Client> {
  const c = new Client({ name: "test-assistant", version: "1.0.0" });
  await c.connect(new StreamableHTTPClientTransport(new URL(`${BASE}/mcp/${token}`)));
  return c;
}

const text = (r: unknown) => ((r as { content: { text: string }[] }).content[0]?.text ?? "");
const inbox = async () => ((await (await fetch(`${BASE}/api/hub/inbox`)).json()) as { items: { id: string; command: Command }[] }).items;

beforeAll(async () => {
  gateway = spawn("npx", ["tsx", "apps/assistant/src/server.ts"], { cwd: root, env: { ...process.env, PORT: String(PORT) } });
  await new Promise<void>((resolve, reject) => {
    gateway.stdout?.on("data", (d: Buffer) => d.toString().includes("gateway on") && resolve());
    gateway.on("exit", (code) => reject(new Error(`gateway exited ${code}`)));
    setTimeout(() => reject(new Error("gateway did not start")), 15_000);
  });
  const put = await fetch(`${BASE}/api/hub/world`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(world()) });
  expect(put.status).toBe(204);
}, 20_000);

afterAll(() => {
  gateway.kill();
});

describe("MCP connector", () => {
  it("lists the three tools an assistant can use", async () => {
    const c = await client();
    const { tools } = await c.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(["read_record", "suggest_record_updates", "write_journal_entry"]);
    await c.close();
  });

  it("serves only shared sections with the rules, and queues the read so it shows as a view", async () => {
    const c = await client();
    const out = text(await c.callTool({ name: "read_record", arguments: {} }));
    expect(out).toMatch(/Never diagnose/);
    expect(out).toContain("A1c: 5.7 %");
    expect(out).not.toContain("Combined oral contraceptive");
    expect(out).toMatch(/Not shared with you: .*Medications/);
    expect((await inbox()).at(-1)?.command).toMatchObject({ type: "viewRecord", by: "assistant", recipientId: "ai-claude" });
    await c.close();
  });

  it("queues journal entries and drafts for the app, and skips drafts that can't apply", async () => {
    const c = await client();
    expect(text(await c.callTool({ name: "write_journal_entry", arguments: { text: "Slept badly, skin flared." } }))).toMatch(/Saved/);
    const drafts = [
      { kind: "checkIn", why: "Slept badly", date: null, mood: null, sleep: 2, energy: null, skin: 2, name: null, detail: null, text: null },
      { kind: "stopMed", why: "stopped metformin", date: null, mood: null, sleep: null, energy: null, skin: null, name: "Metformin", detail: null, text: null },
    ];
    expect(text(await c.callTool({ name: "suggest_record_updates", arguments: { drafts } }))).toMatch(/Sent 1 draft.*1 skipped: Metformin isn't on her list/);
    const types = (await inbox()).map((i) => i.command.type);
    expect(types).toEqual(expect.arrayContaining(["writeJournal", "suggestUpdates"]));
    await c.close();
  });

  it("refuses unknown tokens, and keeps app endpoints off any public host", async () => {
    await expect(client("ffffffffffffffffffffffffffffffff")).rejects.toThrow();
    const status = await new Promise<number>((resolve) => {
      request(`${BASE}/api/hub/inbox`, { headers: { host: "attune.example-tunnel.dev" } }, (res) => resolve(res.statusCode ?? 0)).end();
    });
    expect(status).toBe(403);
  });
});
