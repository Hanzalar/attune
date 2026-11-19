/** Display formatting. Times show in the practice's zone so everyone sees the same visit time. */
import { DEMO_TZ } from "@attune/domain";

export function when(iso: string, timeZone = DEMO_TZ): string {
  return new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export function dayLong(iso: string, timeZone = DEMO_TZ): string {
  return new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long", month: "long", day: "numeric" }).format(new Date(iso));
}

export function clock(iso: string, timeZone = DEMO_TZ): string {
  return new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export function dateShort(isoOrDate: string): string {
  const d = isoOrDate.length === 10 ? new Date(`${isoOrDate}T12:00:00Z`) : new Date(isoOrDate);
  return new Intl.DateTimeFormat("en-US", { timeZone: isoOrDate.length === 10 ? "UTC" : DEMO_TZ, month: "short", day: "numeric", year: "numeric" }).format(d);
}

/** "3 min ago", "2 days ago". */
export function ago(iso: string, now: string): string {
  const s = Math.max(0, (new Date(now).getTime() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)} h ago`;
  const d = Math.floor(s / 86_400);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

export function money(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function daysWaiting(since: string | null, now: string): string {
  if (!since) return "—";
  const d = Math.floor((new Date(now).getTime() - new Date(since).getTime()) / 86_400_000);
  return d < 1 ? "today" : `${d} day${d === 1 ? "" : "s"}`;
}
