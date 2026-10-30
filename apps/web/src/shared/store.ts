/**
 * One shared referral record for every hosted view.
 * The demo has no backend: state lives in this browser and syncs live across tabs, so a presenter can open
 * the patient, PCP and specialist views side by side. A server-backed store replaces this behind the same hook
 * (openspec change `shared-record-api`).
 */
import { useSyncExternalStore } from "react";
import { DEMO_SPECIALISTS, DomainError, demoReferral, dispatch, type Command, type Referral } from "@attune/domain";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type Action = DistributiveOmit<Command, "at">;

const KEY = "attune.demo.referral.v1";
const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("attune-demo");
const listeners = new Set<() => void>();

function load(): Referral {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Referral;
  } catch {
    // Storage blocked or corrupt: start from the demo record.
  }
  return demoReferral();
}

let state = load();

function publish(next: Referral, broadcast: boolean) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private mode or blocked storage: the view still works, it just won't persist.
  }
  if (broadcast) channel?.postMessage(next);
  listeners.forEach((l) => l());
}

channel?.addEventListener("message", (e: MessageEvent<Referral>) => publish(e.data, false));
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

/** Returns an error message when the rules refuse the action, so views can show it instead of failing silently. */
export function act(action: Action): string | null {
  try {
    publish(dispatch(state, { ...action, at: new Date().toISOString() } as Command, DEMO_SPECIALISTS, () => new Date().toISOString()), true);
    return null;
  } catch (err) {
    if (err instanceof DomainError) return err.message;
    throw err;
  }
}

export function resetDemo() {
  publish(demoReferral(), true);
}

export function useReferral(): Referral {
  return useSyncExternalStore(subscribe, () => state);
}

export type View = "patient" | "pcp" | "specialist";

export function viewUrl(view: View | "home"): string {
  return view === "home" ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}${view}/`;
}
