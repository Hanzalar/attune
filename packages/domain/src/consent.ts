/**
 * Consent is per section and per recipient, revocable, and logged. A recipient sees a section only while an
 * unrevoked grant exists for it. Every look at her record is recorded so she can see who viewed it.
 */
import { SHARE_CODE_MINUTES } from "./config";
import { addMs, ms } from "./time";
import type { Consent, SectionKey, ShareCode, World } from "./types";

export function activeConsent(w: World, patientId: string, recipientId: string, section: SectionKey): Consent | undefined {
  return w.consents.find(
    (c) => c.patientId === patientId && c.recipientId === recipientId && c.section === section && c.revokedAt === null,
  );
}

export function canSee(w: World, patientId: string, recipientId: string, section: SectionKey): boolean {
  return activeConsent(w, patientId, recipientId, section) !== undefined;
}

export function visibleSections(w: World, patientId: string, recipientId: string): SectionKey[] {
  const keys = w.consents
    .filter((c) => c.patientId === patientId && c.recipientId === recipientId && c.revokedAt === null)
    .map((c) => c.section);
  return [...new Set(keys)];
}

/** Everyone who has, or once had, access to her record, newest grant first. */
export function recipientsOf(w: World, patientId: string): string[] {
  const ids = w.consents
    .filter((c) => c.patientId === patientId)
    .sort((a, b) => ms(b.grantedAt) - ms(a.grantedAt))
    .map((c) => c.recipientId);
  return [...new Set(ids)];
}

/** Grant sections to a recipient, skipping ones already active. Returns the consents list and what was newly granted. */
export function grant(
  w: World,
  patientId: string,
  recipientId: string,
  sections: readonly SectionKey[],
  at: string,
  via: Consent["via"],
): { consents: Consent[]; added: SectionKey[] } {
  const added = sections.filter((s) => !canSee(w, patientId, recipientId, s));
  const fresh = added.map((section): Consent => ({ patientId, recipientId, section, grantedAt: at, revokedAt: null, via }));
  return { consents: [...w.consents, ...fresh], added };
}

export function revoke(w: World, patientId: string, recipientId: string, section: SectionKey, at: string): Consent[] {
  return w.consents.map((c) =>
    c.patientId === patientId && c.recipientId === recipientId && c.section === section && c.revokedAt === null
      ? { ...c, revokedAt: at }
      : c,
  );
}

/**
 * Share codes are short, unambiguous (no 0/O or 1/I) and derived from the code count, so the domain stays
 * deterministic. A production service would draw them from a secure random source.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function makeShareCode(seed: number): string {
  let n = (seed + 1) * 2_654_435_761;
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += ALPHABET[Math.abs(n) % ALPHABET.length];
    n = Math.floor(n / ALPHABET.length) ^ (n << 3);
  }
  return `${out.slice(0, 3)}-${out.slice(3)}`;
}

export function newShareCode(w: World, patientId: string, sections: SectionKey[], at: string): ShareCode {
  return {
    code: makeShareCode(w.shareCodes.length),
    patientId,
    sections,
    createdAt: at,
    expiresAt: addMs(at, SHARE_CODE_MINUTES * 60_000),
    redeemedBy: null,
    redeemedAt: null,
  };
}

export function normalizeCode(input: string): string {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return raw.length === 6 ? `${raw.slice(0, 3)}-${raw.slice(3)}` : input.trim().toUpperCase();
}
