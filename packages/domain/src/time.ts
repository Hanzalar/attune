/** Pure time and distance helpers. Callers pass every timestamp; nothing here reads the clock. */
import type { DayPart, Place, Weekday } from "./types";

const HOUR = 3_600_000;

export function ms(iso: string): number {
  return new Date(iso).getTime();
}

export function addMs(iso: string, delta: number): string {
  return new Date(ms(iso) + delta).toISOString();
}

export function hoursUntil(from: string, to: string): number {
  return (ms(to) - ms(from)) / HOUR;
}

/** Weekday, hour and calendar date of an instant in a practice's time zone. */
export function localParts(iso: string, timeZone: string): { weekday: Weekday; hour: number; date: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday")) as Weekday;
  return { weekday, hour: Number(get("hour")), date: `${get("year")}-${get("month")}-${get("day")}` };
}

export function dayPart(hour: number): DayPart {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

/** Great-circle distance in miles. Good enough for "within 15 miles"; real routing is out of scope. */
export function milesBetween(a: Place, b: Place): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}

/** Whole months between two calendar dates (YYYY-MM-DD or ISO), rounded down. */
export function monthsBetween(earlier: string, later: string): number {
  const a = new Date(earlier);
  const b = new Date(later);
  let months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
  if (b.getUTCDate() < a.getUTCDate()) months -= 1;
  return months;
}

/** The instant when a wall-clock date and time ("2026-11-19", "14:40") happens in a time zone. */
export function zonedToIso(date: string, time: string, timeZone: string): string {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const wall = Date.UTC(y ?? 0, (mo ?? 1) - 1, d ?? 1, h ?? 0, mi ?? 0);
  const offsetAt = (instant: number) => {
    const p = new Intl.DateTimeFormat("en-US", {
      timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).formatToParts(new Date(instant));
    const get = (t: Intl.DateTimeFormatPartTypes) => Number(p.find((x) => x.type === t)?.value);
    return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute")) - instant;
  };
  const first = wall - offsetAt(wall);
  return new Date(wall - offsetAt(first)).toISOString();
}
