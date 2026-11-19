#!/usr/bin/env node
/**
 * Records the Attune demo video: the handoff's cancellation-fill scenario, then the AI journal, Ask and the MCP
 * connector, all on the live production build with synthetic data.
 *
 *   npm run build && node scripts/demo-video/record.mjs [--out scripts/demo-video/out] [--scale 1.5]
 *
 * Needs Google Chrome (or CHROME_PATH) and ffmpeg with libx264 on PATH. It starts its own static server and the
 * assistant gateway, drives everything through stage.html, captures frames over the DevTools protocol and encodes
 * a 1920x1080 30 fps H.264 MP4. Output is generated, so it stays out of git (scripts/demo-video/out/).
 */
import { spawn, execFileSync } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer, request } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SCENES } from "./scenes.mjs";

const here = fileURLToPath(new URL(".", import.meta.url));
const root = resolve(here, "../..");
const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback; };
const OUT = resolve(root, arg("out", "scripts/demo-video/out"));
const SCALE = Number(arg("scale", "1.5"));
const [WEB_PORT, GW_PORT, CDP_PORT] = [5197, 8797, 9557];
const DIST = join(root, "apps/web/dist");
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!existsSync(join(DIST, "patient/index.html"))) throw new Error("Build the app first: npm run build");
execFileSync("ffmpeg", ["-hide_banner", "-version"], { stdio: "ignore" });

// 1. The assistant gateway, for the hub and the connector. It needs no credentials; the video uses demo replies.
const gateway = spawn("npx", ["tsx", "apps/assistant/src/server.ts"], { cwd: root, env: { ...process.env, PORT: String(GW_PORT) }, stdio: ["ignore", "pipe", "inherit"] });
await new Promise((ok, fail) => { gateway.stdout.on("data", (d) => String(d).includes("gateway on") && ok()); setTimeout(() => fail(new Error("gateway did not start")), 20_000); });

// 2. One origin for the stage, the app and the gateway's app endpoints, so the stage can drive the app's frames.
const fontFile = (name) => join(root, "node_modules/@fontsource", name.startsWith("instrument-serif") ? "instrument-serif" : "instrument-sans", "files", name);
const web = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (path.startsWith("/api/")) {
    const up = request({ host: "127.0.0.1", port: GW_PORT, path: req.url, method: req.method, headers: { ...req.headers, host: "localhost" } }, (r) => { res.writeHead(r.statusCode ?? 502, r.headers); r.pipe(res); });
    up.on("error", () => { res.writeHead(502); res.end(); });
    return void req.pipe(up);
  }
  let file = path === "/stage/" ? join(here, "stage.html") : path.startsWith("/fonts/") ? fontFile(path.slice(7)) : join(DIST, path);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!file.startsWith(root) || !existsSync(file)) { res.writeHead(404); return void res.end(); }
  res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
}).listen(WEB_PORT, "127.0.0.1");

// 3. Headless Chrome over the DevTools protocol.
const profile = mkdtempSync(join(tmpdir(), "attune-video-"));
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profile}`, "--no-first-run", "--hide-scrollbars", "--force-color-profile=srgb", "--disable-gpu", "about:blank"], { stdio: "ignore" });
let target;
for (let i = 0; i < 40 && !target; i++) { await sleep(250); target = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: "PUT" }).then((r) => r.json()).catch(() => undefined); }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0;
const pending = new Map();
const frames = [];
const problems = [];
let frameDir = null;
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Page.screencastFrame") {
    const name = `f${String(frames.length).padStart(6, "0")}.jpg`;
    writeFileSync(join(frameDir, name), Buffer.from(m.params.data, "base64"));
    frames.push({ name, t: m.params.metadata.timestamp });
    void send("Page.screencastFrameAck", { sessionId: m.params.sessionId });
  }
  if (m.method === "Runtime.exceptionThrown") problems.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }); return r.result?.result?.value ?? r.result?.exceptionDetails?.exception?.description; };
const stage = async (fn, ...args) => {
  const out = await ev(`stage.${fn}(${args.map((a) => JSON.stringify(a)).join(",")})`);
  if (typeof out === "string" && out !== "ok" && fn !== "world") problems.push(`${fn}(${JSON.stringify(args[1] ?? args[0])}): ${out}`);
  return out;
};

await send("Runtime.enable");
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: SCALE, mobile: false });
await send("Page.navigate", { url: `http://localhost:${WEB_PORT}/stage/` });
await sleep(1500);

// 4. Set up off camera: a fresh "fill" world, holds at 10x so the countdown is readable.
await stage("controls", "/demo/", ["Start at the fill", "Yes, reset", "10×"]);
await sleep(800);

// The connector, as an assistant would call it, for the scene that shows it.
async function connector(token, show) {
  const c = new Client({ name: "attune-connector-test-client", version: "1.0.0" });
  await c.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${GW_PORT}/mcp/${token}`)));
  const call = async (name, args, label) => {
    await show(`<span class="tool">→ ${name}</span> <span class="arg">${label}</span>`);
    const out = await c.callTool({ name, arguments: args });
    const text = out.content?.[0]?.text ?? "";
    await show(`<span class="ok">✓ ${text.split("\n")[0].replace(/^You help one patient.*/, "Her shared sections, with sources and the rules").slice(0, 120)}</span>`);
  };
  return { call, close: () => c.close() };
}

frameDir = mkdtempSync(join(tmpdir(), "attune-frames-"));
await send("Page.startScreencast", { format: "jpeg", quality: 92, everyNthFrame: 1 });
const t0 = Date.now();
for (const scene of SCENES) {
  process.stdout.write(`scene ${scene.name}… `);
  await scene.run({ stage, sleep, connector, world: () => stage("world") });
  console.log(`${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
await sleep(400);
await send("Page.stopScreencast");
await sleep(300);

// 5. Encode: each captured frame lasts until the next one, resampled to a constant 30 fps.
mkdirSync(OUT, { recursive: true });
const list = frames.map((f, i) => `file '${join(frameDir, f.name)}'\nduration ${Math.max(0.001, (frames[i + 1]?.t ?? f.t + 1.5) - f.t).toFixed(4)}`).join("\n") + `\nfile '${join(frameDir, frames.at(-1).name)}'\n`;
writeFileSync(join(frameDir, "list.txt"), list);
const mp4 = join(OUT, "attune-demo.mp4");
execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", join(frameDir, "list.txt"),
  "-vf", "fps=30,scale=1920:1080:flags=lanczos,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-profile:v", "high",
  "-movflags", "+faststart", "-metadata", "title=Attune prototype demo (synthetic data)", mp4], { stdio: "inherit" });
execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-ss", "3", "-i", mp4, "-frames:v", "1", join(OUT, "attune-demo-poster.png")]);

console.log(`\n${frames.length} frames captured · ${mp4}`);
console.log(problems.length ? `problems:\n- ${problems.join("\n- ")}` : "problems: none");
ws.close();
chrome.kill();
gateway.kill();
web.close();
rmSync(frameDir, { recursive: true, force: true });
rmSync(profile, { recursive: true, force: true });
