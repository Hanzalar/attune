/** Hash routes for the patient app. Home is the only home screen; everything else is one tap deep. */
import { useEffect, useState } from "react";
import { DEMO_IDS, DEMO_PEOPLE, DEMO_TZ, localParts } from "@attune/domain";

export const PATIENT_ID = DEMO_IDS.patient;
export const ME = { by: "patient" as const, who: DEMO_PEOPLE.patient };

export type Route =
  | { name: "home" }
  | { name: "welcome" }
  | { name: "checkin" }
  | { name: "record" }
  | { name: "care" }
  | { name: "share" }
  | { name: "insurance" }
  | { name: "waitlist" }
  | { name: "offer"; id: string }
  | { name: "booked" }
  | { name: "pack" }
  | { name: "summary" }
  | { name: "journal" }
  | { name: "ask"; q: string }
  | { name: "assistants" };

const SIMPLE = ["welcome", "checkin", "record", "care", "share", "insurance", "waitlist", "booked", "pack", "summary", "journal", "assistants"] as const;

export function parse(hash: string): Route {
  const [path = "", query = ""] = hash.replace(/^#\/?/, "").split("?");
  const parts = path.split("/").filter(Boolean);
  const [head, arg] = parts;
  if (head === "offer" && arg) return { name: "offer", id: decodeURIComponent(arg) };
  if (head === "ask") return { name: "ask", q: new URLSearchParams(query).get("q") ?? "" };
  const simple = SIMPLE.find((s) => s === head);
  return simple ? { name: simple } : { name: "home" };
}

export function go(path: string) {
  window.location.hash = path.startsWith("/") ? path : `/${path}`;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash));
  useEffect(() => {
    const on = () => {
      setRoute(parse(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

export function greeting(now: string): string {
  const hour = localParts(now, DEMO_TZ).hour;
  return hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
}

export function weekdayName(now: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: DEMO_TZ, weekday: "long" }).format(new Date(now));
}

/** Day 1 is the day she onboarded. */
export function dayNumber(onboardedAt: string | null, now: string): number {
  if (!onboardedAt) return 1;
  const a = localParts(onboardedAt, DEMO_TZ).date;
  const b = localParts(now, DEMO_TZ).date;
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000) + 1;
}
