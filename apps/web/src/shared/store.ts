/**
 * One shared world for every hosted view. The demo has no backend: state lives in this browser and syncs live across
 * tabs, so a presenter can run the patient app, PCP portal and specialist portal side by side. A server-backed store
 * replaces this behind the same hooks (openspec change `shared-record-api`).
 *
 * Hold timers need exactly one clock. One tab takes a Web Lock and runs the ticker; the others listen.
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import { DomainError, demoWorld, run, settle, type Command, type World } from "@attune/domain";

const KEY = "attune.world.v4";
const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("attune-world");
const listeners = new Set<() => void>();

/** Real time plus the demo clock offset. Every command and countdown uses this. */
export function nowIso(w: World = state): string {
  return new Date(Date.now() + w.clock.offsetMs).toISOString();
}

function fresh(mode: "fresh" | "fill"): World {
  return demoWorld(new Date().toISOString(), mode);
}

function load(): World {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as World;
      if (parsed.schema === 4) return parsed;
    }
  } catch {
    // Storage blocked or corrupt: start from the demo world.
  }
  return fresh("fill");
}

let state: World = load();

function publish(next: World, broadcast: boolean) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private mode or full storage: this tab still works, it just won't persist.
  }
  if (broadcast) channel?.postMessage(next);
  listeners.forEach((l) => l());
}

channel?.addEventListener("message", (e: MessageEvent<World>) => publish(e.data, false));
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      state = load();
      listeners.forEach((l) => l());
    }
  });
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useWorld(): World {
  return useSyncExternalStore(subscribe, () => state);
}

/** The demo clock, re-read every `everyMs`. Countdowns use it. */
export function useNow(everyMs = 1000): string {
  const w = useWorld();
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), everyMs);
    return () => window.clearInterval(id);
  }, [everyMs]);
  return nowIso(w);
}

/** Run a command. Returns the rule's own message when refused, so views can show it instead of failing silently. */
export function act(cmd: Command): string | null {
  try {
    publish(run(state, cmd, nowIso()), true);
    return null;
  } catch (err) {
    if (err instanceof DomainError) return err.message;
    throw err;
  }
}

export function resetWorld(mode: "fresh" | "fill") {
  publish(fresh(mode), true);
}

let ticking = false;

/**
 * Sync with the assistant gateway's hub, when one is running: push the record so a connected assistant can read
 * what she shared, and pull what assistants sent through the MCP connector (journal entries, drafts). Pulled items
 * run through act(), so the domain checks the connection and consent like any other command. Without a gateway
 * (the public demo) this backs off quietly.
 */
const HUB = `${import.meta.env.VITE_ASSISTANT_URL ?? ""}/api/hub`;
let pushed: World | null = null;
let hubRetryAt = 0;
let hubBusy = false;

async function syncHub() {
  if (hubBusy || Date.now() < hubRetryAt) return;
  hubBusy = true;
  try {
    if (pushed !== state) {
      const snapshot = state;
      const put = await fetch(`${HUB}/world`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(snapshot) });
      if (!put.ok) throw new Error("hub unavailable");
      pushed = snapshot;
    }
    const res = await fetch(`${HUB}/inbox`);
    if (!res.ok) throw new Error("hub unavailable");
    const { items } = (await res.json()) as { items: { id: string; command: Command }[] };
    if (items.length) {
      const results = items.map((item) => ({ id: item.id, error: act(item.command) }));
      await fetch(`${HUB}/ack`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ results }) });
    }
  } catch {
    hubRetryAt = Date.now() + 15_000;
  } finally {
    hubBusy = false;
  }
}

/** Start the single shared ticker. Safe to call from every page; only one tab runs it at a time. */
export function startTicker() {
  if (ticking || typeof window === "undefined") return;
  ticking = true;
  const loop = () =>
    new Promise<void>(() => {
      window.setInterval(() => {
        const next = settle(state, nowIso());
        if (next !== state) publish(next, true);
        void syncHub();
      }, 1000);
    });
  if (navigator.locks?.request) void navigator.locks.request("attune-ticker", loop);
  else void loop();
}

export type View = "patient" | "pcp" | "specialist" | "ops" | "demo";

export function viewUrl(view: View, hash = ""): string {
  return `${import.meta.env.BASE_URL}${view}/${hash ? `#${hash}` : ""}`;
}
