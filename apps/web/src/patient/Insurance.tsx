/**
 * Insurance card: she photographs it, confirms the plan and the last four digits. In the demo the photo stays on her
 * device and is discarded; only the plan and last four are kept. Attune's team runs the eligibility check.
 */
import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { type Patient, type World } from "@attune/domain";
import { RADIUS, SIZE, T } from "../design/tokens";
import { ago } from "../shared/format";
import { Button, Field, Notice, Overline, Paper, inputStyle, useAct, useToast } from "../shared/ui";
import { ME, go } from "./nav";
import { Body, Screen, Small } from "./Screen";

export function Insurance({ w, patient, now }: { w: World; patient: Patient; now: string }) {
  const [toast, show] = useToast();
  const run = useAct(show);
  const ins = patient.insurance;
  const [photo, setPhoto] = useState<string | null>(null);
  const [planId, setPlanId] = useState(ins?.planId ?? w.plans[0]?.id ?? "");
  const [last4, setLast4] = useState(ins?.memberIdLast4 ?? "");
  const [editing, setEditing] = useState(!ins || ins.issue !== null);

  // The preview URL lives only in this tab; release it when the photo changes or the screen closes.
  useEffect(() => () => {
    if (photo) URL.revokeObjectURL(photo);
  }, [photo]);

  const plan = ins ? w.plans.find((p) => p.id === ins.planId) : undefined;
  const send = () => {
    if (run({ ...ME, type: "captureInsuranceCard", patientId: patient.id, planId, memberIdLast4: last4 }, "Sent for checking.")) {
      setPhoto(null);
      setEditing(false);
    }
  };

  return (
    <Screen overline="Insurance" title="Your card" sub="We check your coverage before any office offers you a time.">
      {ins && plan && (
        <Paper seed={71} torn={false}>
          <Overline>On file</Overline>
          <Body style={{ marginTop: 8, fontWeight: 600 }}>{plan.carrier}</Body>
          <Body>{plan.name} ({plan.type}) · member ID ending <span className="tnum">{ins.memberIdLast4}</span></Body>
          <div style={{ marginTop: 12 }}>
            {ins.issue ? (
              <Notice tone="issue" title="We couldn't confirm your coverage">{ins.issue} Retake the photo below.</Notice>
            ) : ins.verifiedAt ? (
              <Notice tone="done" title="Coverage checked">Last checked {ago(ins.verifiedAt, now)}. We re-check before each offer.</Notice>
            ) : (
              <Notice tone="attention" title="Checking your coverage">Our team is checking it now. You'll get a message when it's done.</Notice>
            )}
          </div>
          {!editing && <Button variant="secondary" size="md" style={{ marginTop: 12 }} onClick={() => setEditing(true)}>Use a different card</Button>}
        </Paper>
      )}

      {editing && (
        <Paper seed={72} torn={false}>
          <div className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="card-photo"
                className="flex flex-col items-center justify-center gap-2"
                style={{ minHeight: 150, border: `1.5px dashed ${T.line}`, borderRadius: RADIUS.md, cursor: "pointer", color: T.forest, fontSize: SIZE.body, fontWeight: 600, overflow: "hidden", background: T.bone }}
              >
                {photo ? (
                  <img src={photo} alt="Your card photo, shown only on this device" style={{ width: "100%", maxHeight: 220, objectFit: "contain" }} />
                ) : (
                  <>
                    <Camera size={28} aria-hidden />
                    Take a photo of the front of your card
                  </>
                )}
              </label>
              <input
                id="card-photo" type="file" accept="image/*" capture="environment" className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setPhoto(file ? URL.createObjectURL(file) : null);
                }}
              />
              <Small style={{ marginTop: 6 }}>In this demo the photo stays on your device and is discarded. We keep the plan and the last four digits only.</Small>
            </div>
            <Field label="Plan on your card" htmlFor="plan">
              <select id="plan" value={planId} onChange={(e) => setPlanId(e.target.value)} style={inputStyle}>
                {w.plans.map((p) => <option key={p.id} value={p.id}>{p.carrier} · {p.name}</option>)}
              </select>
            </Field>
            <Field label="Last four digits of your member ID" htmlFor="last4">
              <input id="last4" inputMode="numeric" autoComplete="off" maxLength={4} value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, ""))} style={{ ...inputStyle, letterSpacing: "0.2em" }} className="tnum" />
            </Field>
            <Button full onClick={send} disabled={last4.length !== 4}>Send for checking</Button>
            {last4.length !== 4 && <Small style={{ textAlign: "center" }}>Enter all four digits to send.</Small>}
          </div>
        </Paper>
      )}
      <Button full variant="secondary" onClick={() => go("/")}>Back to home</Button>
      {toast}
    </Screen>
  );
}
