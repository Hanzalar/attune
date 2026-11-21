/**
 * Attune's connector, from the app's side. She talks to her assistant (Claude, ChatGPT or any MCP app) in that
 * assistant's own app; the assistant reaches her record through this private address. The token in it belongs to
 * her assistant link, so disconnecting ends it.
 */

import { useEffect, useState } from "react";

/** Where the connector gateway listens when run locally (`npm run assistant`). Override with VITE_CONNECTOR_BASE. */
const LOCAL_GATEWAY = "http://localhost:8787";

/** A connector token: random, URL-safe, made in the browser and kept in her assistant link. */
export function newToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function connectorUrl(token: string): string {
  return `${import.meta.env.VITE_CONNECTOR_BASE ?? LOCAL_GATEWAY}/mcp/${token}`;
}

/**
 * Whether the connector gateway answers from here. The public demo is a static site with no gateway, so the patient
 * app says so instead of presenting a connection that can't reach an assistant. Null while checking.
 */
export function useConnectorAvailable(): boolean | null {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`${import.meta.env.VITE_GATEWAY_URL ?? ""}/api/hub/inbox`)
      .then((r) => live && setOk(r.ok))
      .catch(() => live && setOk(false));
    return () => {
      live = false;
    };
  }, []);
  return ok;
}
