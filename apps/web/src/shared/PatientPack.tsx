/**
 * The Patient Pack: the one page Attune builds for a clinician from her record. Her story in her own words, the PCP's
 * referral note, results, check-in trends, medications and insurance. Display only: every item names its source and
 * nothing is interpreted. Sections she hasn't shared with the viewer say so instead of disappearing.
 */
import { useState, type ReactNode } from "react";
import { Copy, Lock, Printer } from "lucide-react";
import {
  MODE, PRODUCT_NAME, SECTION_STAFF, SPECIALTY, canSee, todayIn, type Referral, type SectionKey, type Slot, type World,
} from "@attune/domain";
import { RADIUS, SIZE, T } from "../design/tokens";
import { dateShort, when } from "./format";
import { viewUrl } from "./store";
import { Trends } from "./Trends";
import { Button, Overline, Tag, Voice, td, th as thBase } from "./ui";

/** Table headers stay at 14px here because patients read the Pack too. */
const th = { ...thBase, fontSize: SIZE.sm, letterSpacing: "0.02em", textTransform: "none" as const };

interface Props {
  w: World;
  patientId: string;
  /** Practice viewing the pack; null when she is previewing her own. */
  viewerId: string | null;
  referral: Referral | null;
  slot?: Slot | null;
  now: string;
  exportable?: boolean;
}

function Section({ title, source, shown, children }: { title: string; source?: string; shown: boolean; children: ReactNode }) {
  return (
    <section style={{ padding: "14px 0", borderTop: `1px solid ${T.hairline}`, breakInside: "avoid" }}>
      <div className="flex flex-wrap items-baseline justify-between gap-2" style={{ marginBottom: 8 }}>
        <h3 style={{ fontSize: SIZE.body, fontWeight: 600, color: T.forest, margin: 0 }}>{title}</h3>
        {shown && source && <span style={{ fontSize: SIZE.sm, color: T.inkMuted }}>Source: {source}</span>}
      </div>
      {shown ? (
        children
      ) : (
        <p className="flex items-center gap-2" style={{ fontSize: SIZE.sm, color: T.inkMuted, margin: 0 }}>
          <Lock size={14} aria-hidden /> Not shared with this office.
        </p>
      )}
    </section>
  );
}

export function PatientPack({ w, patientId, viewerId, referral, slot, now, exportable }: Props) {
  const [copied, setCopied] = useState(false);
  const patient = w.patients.find((p) => p.id === patientId);
  if (!patient) return null;
  const shown = (s: SectionKey) => viewerId === null || canSee(w, patientId, viewerId, s);
  const practice = slot ? w.practices.find((p) => p.id === slot.practiceId) : undefined;
  const pcp = w.practices.find((p) => p.id === patient.pcpId);
  const plan = patient.insurance ? w.plans.find((p) => p.id === patient.insurance?.planId) : undefined;
  const link = referral ? `${window.location.origin}${viewUrl("specialist", `pack/${referral.id}`)}` : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article aria-label="Patient Pack" style={{ color: T.forest }}>
      <header className="flex flex-wrap items-start justify-between gap-3" style={{ paddingBottom: 12 }}>
        <div>
          <Overline>Patient Pack · {PRODUCT_NAME}</Overline>
          <Voice as="h2" size={SIZE.xl} style={{ marginTop: 6 }}>{viewerId === null ? "What the office will see" : patient.name}</Voice>
          <p style={{ fontSize: SIZE.sm, color: T.inkMuted, margin: "6px 0 0" }}>
            DOB {dateShort(patient.dob)} · Ref <span className="tnum">{patient.ref}</span>
            {referral && ` · Referred to ${SPECIALTY[referral.specialty].label}`}
          </p>
          {slot && practice && (
            <p style={{ fontSize: SIZE.sm, color: T.forest, margin: "4px 0 0", fontWeight: 600 }}>
              {when(slot.startsAt, practice.timeZone)} · {slot.provider} · {MODE[slot.mode]} · {practice.name}
            </p>
          )}
        </div>
        {exportable && (
          <div className="no-print flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" icon={<Printer size={15} aria-hidden />} onClick={() => window.print()}>Print or save as PDF</Button>
            {referral && <Button variant="secondary" size="sm" icon={<Copy size={15} aria-hidden />} onClick={() => void copy()}>{copied ? "Link copied" : "Copy secure link"}</Button>}
          </div>
        )}
      </header>
      {exportable && referral && (
        <p className="no-print" style={{ fontSize: SIZE.sm, color: T.inkMuted, margin: "0 0 10px" }}>
          Demo link: it opens in this browser only, and only while she shares with your office.
        </p>
      )}
      <p style={{ fontSize: SIZE.sm, background: T.bone, borderRadius: RADIUS.sm, padding: "8px 10px", margin: "0 0 4px" }}>
        Display only. Built from her record with her consent. {PRODUCT_NAME} does not diagnose, score or recommend treatment.
      </p>

      <Section title={SECTION_STAFF.story} source="Patient, in her own words" shown={shown("story")}>
        {patient.story ? (
          <div className="flex flex-col gap-3">
            {patient.story.words && <blockquote className="voice" style={{ fontSize: SIZE.lg, lineHeight: 1.3, color: T.wine, margin: 0 }}>“{patient.story.words}”</blockquote>}
            {[["Hardest lately", patient.story.hardest], ["Wants help with", patient.story.helpWith], ["Has tried", patient.story.tried]].map(([label, items]) => (
              <div key={label as string} className="flex flex-wrap items-center gap-1.5" style={{ fontSize: SIZE.sm }}>
                <span style={{ color: T.inkMuted, minWidth: 116 }}>{label as string}</span>
                {(items as string[]).length ? (items as string[]).map((i) => <Tag key={i}>{i}</Tag>) : <span>—</span>}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: SIZE.sm, margin: 0 }}>Not written yet.</p>
        )}
      </Section>

      <Section title="PCP referral note" source={pcp?.name} shown={referral !== null}>
        {referral && (
          <div style={{ fontSize: SIZE.sm, lineHeight: 1.5 }}>
            <p style={{ margin: 0, fontSize: SIZE.body }}>{referral.reason || "No reason written yet."}</p>
            <p style={{ margin: "8px 0 0", color: T.inkMuted }}>
              {referral.signature ? `Signed ${dateShort(referral.signature.at)} by ${referral.signature.signer}: “${referral.signature.attestation}”` : "Not signed yet."}
              {referral.urgent && " · Flagged urgent by the PCP."}
            </p>
            {referral.patientUpdate && <p style={{ margin: "8px 0 0" }}><strong>Update from her before the visit:</strong> {referral.patientUpdate}</p>}
          </div>
        )}
      </Section>

      <Section title={SECTION_STAFF.results} shown={shown("results")}>
        {patient.results.length ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 460 }}>
              <thead><tr><th style={th}>Test</th><th style={th}>Result</th><th style={th}>Lab range</th><th style={th}>Collected</th><th style={th}>Source</th></tr></thead>
              <tbody>
                {patient.results.map((r) => (
                  <tr key={`${r.name}-${r.collectedOn}`}>
                    <td style={{ ...td, fontWeight: 600 }}>{r.name}</td><td style={td} className="tnum">{r.value}</td><td style={td} className="tnum">{r.range}</td>
                    <td style={td} className="tnum">{dateShort(r.collectedOn)}</td><td style={{ ...td, color: T.inkMuted }}>{r.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ fontSize: SIZE.sm, margin: 0 }}>No results on file.</p>
        )}
      </Section>

      <Section title={SECTION_STAFF.trends} source="Patient check-ins" shown={shown("trends")}>
        <Trends checkIns={patient.checkIns} today={todayIn(now, practice?.timeZone ?? "America/Chicago")} dense />
      </Section>

      <Section title={SECTION_STAFF.meds} shown={shown("meds")}>
        {patient.meds.length ? (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: SIZE.sm, lineHeight: 1.6 }}>
            {patient.meds.map((m) => <li key={m.name}><strong>{m.name}</strong>, {m.detail.toLowerCase()}, since {m.since} <span style={{ color: T.inkMuted }}>({m.source})</span></li>)}
          </ul>
        ) : (
          <p style={{ fontSize: SIZE.sm, margin: 0 }}>None listed.</p>
        )}
      </Section>

      <Section title={SECTION_STAFF.insurance} source="Card photo, checked by Attune" shown={shown("insurance")}>
        {patient.insurance && plan ? (
          <p style={{ fontSize: SIZE.sm, margin: 0 }}>
            {plan.carrier} · {plan.name} ({plan.type}) · Member ID ending <span className="tnum">{patient.insurance.memberIdLast4}</span>
            {patient.insurance.verifiedAt ? ` · Eligibility checked ${dateShort(patient.insurance.verifiedAt)}` : " · Not checked yet"}
          </p>
        ) : (
          <p style={{ fontSize: SIZE.sm, margin: 0 }}>No card on file.</p>
        )}
      </Section>
      <p className="print-only" style={{ fontSize: SIZE.sm, color: T.inkMuted }}>Printed {when(now)} from {PRODUCT_NAME}. Synthetic demo data.</p>
    </article>
  );
}
