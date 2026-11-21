#!/usr/bin/env node
/**
 * Records Attune's three one-minute demo videos from the live production build, with synthetic data:
 *   1 the referral loop · 2 her AI assistant, connected · 3 her first minutes in Attune
 *
 *   npm run demo:video                         all three
 *   node scripts/demo-video/record.mjs --film ai   one (referral | ai | patient)
 *
 * Needs Google Chrome (or CHROME_PATH) and ffmpeg with libx264. Starts its own static server and the connector
 * gateway, drives the app through stage.html, captures frames over the Chrome DevTools protocol, and writes
 * 1920x1080 30 fps H.264 MP4s with chapter markers and a poster frame to scripts/demo-video/out/ (git-ignored).
 */
import { spawn, execFileSync } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer, request } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import ai from "./films/ai.mjs";
import patient from "./films/patient.mjs";
import referral from "./films/referral.mjs";

const FILMS = { referral, ai, patient };
const here = fileURLToPath(new URL(".", import.meta.url));
const root = resolve(here, "../..");
const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback; };
const chosen = arg("film", "all");
const films = chosen === "all" ? Object.values(FILMS) : [FILMS[chosen]];
if (films.some((f) => !f)) throw new Error(`Unknown film "${chosen}". Use referral, ai, patient or all.`);
const OUT = resolve(root, arg("out", "scripts/demo-video/out"));
const SCALE = Number(arg("scale", "1.5"));
const [WEB_PORT, GW_PORT, CDP_PORT] = [5197, 8797, 9557];
const DIST = join(root, "apps/web/dist");
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!existsSync(join(DIST, "patient/index.html"))) throw new Error("Build the app first: npm run build");
execFileSync("ffmpeg", ["-hide_banner", "-version"], { stdio: "ignore" });

// The connector gateway: the hub the app syncs with, and the MCP endpoint the scripted assistant calls.
const gateway = spawn("npx", ["tsx", "apps/assistant/src/server.ts"], { cwd: root, env: { ...process.env, PORT: String(GW_PORT) }, stdio: ["ignore", "pipe", "inherit"] });
await new Promise((ok, fail) => { gateway.stdout.on("data", (d) => String(d).includes("gateway on") && ok()); setTimeout(() => fail(new Error("gateway did not start")), 20_000); });

// One origin for the stage, the app and the hub, so the stage can drive the app's frames.
const fontFile = (name) => join(root, "node_modules/@fontsource", name.startsWith("instrument-serif") ? "instrument-serif" : "instrument-sans", "files", name);
const web = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (path.startsWith("/api/")) {
    const up = request({ host: "127.0.0.1", port: GW_PORT, path: req.url, method: req.method, headers: { ...req.headers, host: "localhost" } }, (r) => { res.writeHead(r.statusCode ?? 502, r.headers); r.pipe(res); });
    up.on("error", () => { res.writeHead(502); res.end(); });
    return void req.pipe(up);
  }
  let file = path === "/stage/" ? join(here, "stage.html") : path === "/stage/stage.js" ? join(here, "stage.js") : path.startsWith("/fonts/") ? fontFile(path.slice(7)) : join(DIST, path);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!file.startsWith(root) || !existsSync(file)) { res.writeHead(404); return void res.end(); }
  res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
  createReadStream(file).pipe(res);
}).listen(WEB_PORT, "127.0.0.1");

// Headless Chrome over the DevTools protocol.
const profile = mkdtempSync(join(tmpdir(), "attune-video-"));
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profile}`, "--no-first-run", "--hide-scrollbars", "--force-color-profile=srgb", "--disable-gpu", "about:blank"], { stdio: "ignore" });
let target;
for (let i = 0; i < 40 && !target; i++) { await sleep(250); target = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: "PUT" }).then((r) => r.json()).catch(() => undefined); }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0;
const pending = new Map();
let capture = null;
const problems = [];
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Page.screencastFrame") {
    if (capture) {
      const name = `f${String(capture.frames.length).padStart(6, "0")}.jpg`;
      writeFileSync(join(capture.dir, name), Buffer.from(m.params.data, "base64"));
      capture.frames.push({ name, t: m.params.metadata.timestamp });
    }
    void send("Page.screencastFrameAck", { sessionId: m.params.sessionId });
  }
  if (m.method === "Runtime.exceptionThrown") problems.push(`page error: ${m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text}`);
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }); return r.result?.result?.value ?? r.result?.exceptionDetails?.exception?.description; };
let current = "";
const stage = async (fn, ...args) => {
  const out = await ev(`stage.${fn}(${args.map((a) => JSON.stringify(a)).join(",")})`);
  if (typeof out === "string" && out !== "ok" && fn !== "world") problems.push(`${current} · ${fn}(${JSON.stringify(args[1] ?? args[0])}): ${out}`);
  return out;
};

/** The connector, called the way an assistant would call it. Returns the tool's text. */
async function connector(token) {
  const c = new Client({ name: "attune-scripted-demo-client", version: "1.0.0" });
  await c.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${GW_PORT}/mcp/${token}`)));
  return {
    call: async (name, args) => (await c.callTool({ name, arguments: args })).content?.[0]?.text ?? "",
    close: () => c.close(),
  };
}

/** Frames arrive only when the picture changes, so the film ends at the real end time, not the last frame. */
function encode(film, frames, dir, chapters, endedAt) {
  const end = Math.max(endedAt, frames.at(-1).t + 0.1);
  const list = frames.map((f, i) => `file '${join(dir, f.name)}'\nduration ${Math.max(0.001, (frames[i + 1]?.t ?? end) - f.t).toFixed(4)}`).join("\n") + `\nfile '${join(dir, frames.at(-1).name)}'\n`;
  writeFileSync(join(dir, "list.txt"), list);
  const total = Math.round((end - frames[0].t) * 1000);
  const at = (c) => Math.max(0, Math.round((c.at - frames[0].t) * 1000));
  const meta = [";FFMETADATA1", `title=${film.title} (prototype, synthetic data)`, ...chapters.map((c, i) => `[CHAPTER]\nTIMEBASE=1/1000\nSTART=${at(c)}\nEND=${chapters[i + 1] ? at(chapters[i + 1]) : total}\ntitle=${c.title}`)].join("\n");
  writeFileSync(join(dir, "chapters.txt"), `${meta}\n`);
  const mp4 = join(OUT, `attune-${film.slug}.mp4`);
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", join(dir, "list.txt"), "-i", join(dir, "chapters.txt"),
    "-map", "0:v", "-map_metadata", "1", "-map_chapters", "1",
    "-vf", "fps=30,scale=1920:1080:flags=lanczos,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-profile:v", "high",
    "-t", (total / 1000).toFixed(3), "-movflags", "+faststart", mp4], { stdio: "inherit" });
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-ss", "1.6", "-i", mp4, "-frames:v", "1", mp4.replace(/\.mp4$/, "-poster.png")]);
  return { mp4, seconds: total / 1000 };
}

await send("Runtime.enable");
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: SCALE, mobile: false });
await send("Page.navigate", { url: `http://localhost:${WEB_PORT}/stage/` });
await sleep(1500);
await send("Page.startScreencast", { format: "jpeg", quality: 92, everyNthFrame: 1 });
mkdirSync(OUT, { recursive: true });

const results = [];
for (const film of films) {
  current = film.slug;
  // Off camera: a fresh world for this film and readable hold times.
  await stage("reset");
  await stage("controls", "/demo/", [film.world, "Yes, reset", film.speed]);
  await sleep(900);
  capture = { dir: mkdtempSync(join(tmpdir(), "attune-frames-")), frames: [] };
  const chapters = [];
  for (const scene of film.scenes) {
    chapters.push({ title: scene.chapter, at: Date.now() / 1000 });
    await scene.run({ stage, sleep, connector, world: () => stage("world") });
  }
  const endedAt = Date.now() / 1000;
  await sleep(300);
  const { frames, dir } = capture;
  capture = null;
  const out = encode(film, frames, dir, chapters, endedAt);
  rmSync(dir, { recursive: true, force: true });
  results.push(out);
  console.log(`${film.slug}: ${out.seconds.toFixed(1)} s, ${frames.length} frames → ${out.mp4}`);
}

await send("Page.stopScreencast");
console.log(problems.length ? `problems:\n- ${problems.join("\n- ")}` : "problems: none");
ws.close();
chrome.kill();
gateway.kill();
web.close();
rmSync(profile, { recursive: true, force: true });
