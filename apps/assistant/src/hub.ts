/**
 * The hub between the app and connected assistants. The app pushes its record here and pulls what assistants sent.
 * The app stays the only writer: inbox items are commands it runs through the domain, so consent and the
 * connection are checked there. Memory only; nothing is written to disk.
 */
import type { Command, World } from "@attune/domain";

interface Item {
  id: string;
  command: Command;
  at: string;
}

let world: World | null = null;
let seq = 0;
const inbox: Item[] = [];

export const hub = {
  setWorld(next: World) {
    world = next;
  },
  world(): World | null {
    return world;
  },
  /** The demo clock the app runs on, so connector reads see the same "now". */
  now(): string {
    return new Date(Date.now() + (world?.clock.offsetMs ?? 0)).toISOString();
  },
  enqueue(command: Command): string {
    const id = `i-${++seq}`;
    inbox.push({ id, command, at: new Date().toISOString() });
    return id;
  },
  pending(): Item[] {
    return [...inbox];
  },
  ack(results: { id: string; error: string | null }[]) {
    for (const r of results) {
      const i = inbox.findIndex((x) => x.id === r.id);
      if (i >= 0) inbox.splice(i, 1);
      if (r.error) console.warn(`[hub] the app refused ${r.id}: ${r.error}`);
    }
  },
};
