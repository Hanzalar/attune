import { useState } from "react";
import { Check, PenLine, Send, X } from "lucide-react";
import {
  ATTESTATION, DEMO_PEOPLE, SPECIALTY, checkCompleteness, type Patient, type Referral, type World,
} from "@attune/domain";
import { RADIUS, SIZE, T } from "../design/tokens";
import { Button, Chip, Field, Notice, Panel, StatusPill, inputStyle } from "../shared/ui";
import { AttachButtons } from "./Attach";
import { CheckRow } from "../shared/Clinic";
import { FaxPreview } from "./FaxPreview";
import { attachable } from "./next";
import type { Actor, Run } from "./types";

/**
 * Draft → signed referral. The MA writes the reason and sees, live, which practices' criteria it meets. Only the
 * physician can attest "I evaluated this patient" and send; the MA hands it over rather than signing for them.
 */
export function Builder({ w, now, patient, referral, actor, run, onSignAs }: {
  w: World; now: string; patient: Patient; referral: Referral; actor: Actor; run: Run; onSignAs: () => void;
}) {
  const [reason, setReason] = useState(referral.reason);
  const [urgent, setUrgent] = useState(referral.urgent);
  const [route, setRoute] = useState<"attune" | "fallback">("attune");
  const offAttune = w.practices.filter((p) => p.kind === "specialist" && !p.onAttune && p.specialty === referral.specialty);
  const [faxPracticeId, setFaxPracticeId] = useState(offAttune[0]?.id ?? "");
  const [attested, setAttested] = useState(false);

  const hypothetical: Referral = { ...referral, reason, urgent, signature: { signer: DEMO_PEOPLE.physician, role: "pcp_physician", attestation: ATTESTATION, at: now } };
  const practices = w.practices.filter((p) => p.kind === "specialist" && p.onAttune && p.specialty === referral.specialty);
  const checks = practices.map((p) => ({ practice: p, result: checkCompleteness(p, patient, hypothetical, now) }));
  const complete = checks.filter((c) => c.result.complete).length;
  const isPhysician = actor.by === "pcp_physician";
  const planId = patient.insurance?.planId;

  const send = () =>
    run(
      { ...actor, type: "signAndSend", referralId: referral.id, reason, urgent, attested, faxPracticeId: route === "fallback" ? faxPracticeId : null },
      route === "fallback" ? "Signed. Packet prepared (not transmitted in the prototype)." : "Signed and sent. Attune is checking it now.",
    );

  return (
    <Panel title={`Referral to ${SPECIALTY[referral.specialty].label}`} meta={`Draft · prepared by ${referral.preparedBy}`} actions={<StatusPill tone="neutral" label="Draft" />}>
      <div className="flex flex-col gap-4">
        <Field label="Reason for referral" htmlFor="reason" hint="Your words travel in her Patient Pack. A sentence or two.">
          <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={4} style={{ ...inputStyle, minHeight: 96, resize: "vertical", fontSize: SIZE.sm }} />
        </Field>
        <CheckRow id="urgent" checked={urgent} onChange={setUrgent} label="Urgent: offer her openings first" detail="Your flag is the only clinical input to who is offered a slot first." />

        <div>
          <p style={{ fontSize: SIZE.sm, fontWeight: 600, margin: "0 0 4px" }}>Criteria check</p>
          <p style={{ fontSize: SIZE.sm, color: T.inkMuted, margin: "0 0 8px" }}>
            Meets {complete} of {practices.length} practices' published criteria. She is offered openings only where the referral is complete.
          </p>
          <div className="flex flex-col gap-2">
            {checks.map(({ practice, result }) => {
              // checks[0] is the signature; checks[i + 1] belongs to criteria[i].
              const missing = practice.criteria.flatMap((req, i) => (req.kind === "result" && result.checks[i + 1]?.met === false ? [req.name] : []));
              return (
                <div key={practice.id} style={{ border: `1px solid ${T.hairline}`, borderRadius: RADIUS.sm, padding: "8px 10px", background: T.bone }}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span style={{ fontSize: SIZE.sm, fontWeight: 600 }}>{practice.name}</span>
                    <StatusPill size="sm" tone={result.complete ? "done" : "attention"} label={result.complete ? "Complete" : "Incomplete"} />
                  </div>
                  <ul style={{ listStyle: "none", margin: "6px 0 0", padding: 0, fontSize: SIZE.sm }}>
                    {result.checks.map((c) => (
                      <li key={c.label} className="flex items-start gap-1.5" style={{ padding: "2px 0", color: c.met ? T.forest : T.sandInk }}>
                        {c.met ? <Check size={14} aria-hidden style={{ marginTop: 2, flexShrink: 0 }} /> : <X size={14} aria-hidden style={{ marginTop: 2, flexShrink: 0 }} />}
                        <span><span className="sr-only">{c.met ? "Met: " : "Missing: "}</span>{c.label} <span style={{ color: T.inkMuted }}>· {c.detail}</span></span>
                      </li>
                    ))}
                    <li style={{ padding: "2px 0", color: T.inkMuted }}>
                      Her plan: {planId ? (practice.plans.includes(planId) ? "accepted here" : "not accepted here") : "no card yet"} (checked at the insurance step)
                    </li>
                  </ul>
                  {missing.length > 0 && <div style={{ marginTop: 6 }}><AttachButtons results={attachable(patient, missing, now)} referral={referral} patient={patient} actor={actor} run={run} /></div>}
                </div>
              );
            })}
          </div>
        </div>

        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontSize: SIZE.sm, fontWeight: 600, marginBottom: 6 }}>Send through</legend>
          <div className="flex flex-wrap gap-2">
            <Chip selected={route === "attune"} onClick={() => setRoute("attune")}>Attune waitlist</Chip>
            <Chip selected={route === "fallback"} onClick={() => setRoute("fallback")} disabled={offAttune.length === 0}>A practice not on Attune</Chip>
          </div>
          {route === "fallback" && (
            <div className="flex flex-col gap-3" style={{ marginTop: 10 }}>
              <Field label="Practice" htmlFor="fax-practice">
                <select id="fax-practice" value={faxPracticeId} onChange={(e) => setFaxPracticeId(e.target.value)} style={{ ...inputStyle, fontSize: SIZE.sm }}>
                  {offAttune.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <FaxPreview w={w} patient={patient} referral={hypothetical} practiceId={faxPracticeId} />
            </div>
          )}
        </fieldset>

        <div style={{ borderTop: `1px solid ${T.hairline}`, paddingTop: 12 }}>
          <p style={{ fontSize: SIZE.sm, fontWeight: 600, margin: "0 0 2px" }}>Physician sign-off</p>
          <CheckRow id="attest" checked={attested} onChange={setAttested} label={ATTESTATION} detail={`Signing as ${DEMO_PEOPLE.physician}. Attune never signs.`} />
          <div style={{ marginTop: 8 }}>
            {isPhysician ? (
              <Button full size="md" icon={<Send size={16} aria-hidden />} onClick={send}>Sign and send</Button>
            ) : (
              <>
                <Button full size="md" variant="secondary" icon={<PenLine size={16} aria-hidden />} onClick={onSignAs}>Hand to Dr. Patel to sign</Button>
                <div style={{ marginTop: 8 }}><Notice>Only the physician who evaluated her can attest and sign. In the demo this switches who is signed in.</Notice></div>
              </>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}
