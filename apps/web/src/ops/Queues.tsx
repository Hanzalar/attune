/** Ops queues: insurance exceptions, the waitlist (refs only) and live offers. Mocked operations for the prototype. */
import { useState } from "react";
import {
  DEMO_PEOPLE, INSURANCE_FRESH_HOURS, OFFER_STATUS, REFERRAL_STATUS, SPECIALTY, hoursUntil, nameOf, type Command, type Patient, type World,
} from "@attune/domain";
import { SIZE, T } from "../design/tokens";
import { ago, daysWaiting, when } from "../shared/format";
import { Button, Empty, Notice, Panel, StatusPill, formatLeft, inputStyle, td, th } from "../shared/ui";

const OPS = { by: "ops" as const, who: DEMO_PEOPLE.ops };
type Run = (cmd: Command, ok?: string) => boolean;

function insuranceState(p: Patient, now: string): { label: string; tone: "attention" | "issue" } | null {
  const ins = p.insurance;
  if (!ins?.cardCapturedAt) return null;
  if (ins.issue) return { label: "Issue", tone: "issue" };
  if (!ins.verifiedAt) return { label: "Needs check", tone: "attention" };
  if (hoursUntil(ins.verifiedAt, now) > INSURANCE_FRESH_HOURS) return { label: "Check out of date", tone: "attention" };
  return null;
}

export function InsuranceQueue({ w, now, run }: { w: World; now: string; run: Run }) {
  const [issue, setIssue] = useState<Record<string, string>>({});
  const rows = w.patients.flatMap((p) => {
    const state = insuranceState(p, now);
    return state ? [{ p, state }] : [];
  });
  return (
    <Panel title="Insurance exception queue" meta={`${rows.length} waiting`}>
      <Notice>Mocked. A real build runs an eligibility check (X12 270/271) on every card photo and again before each offer; here an operator marks the result.</Notice>
      {rows.length === 0 ? (
        <Empty>No cards waiting for a check.</Empty>
      ) : (
        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 720 }}>
            <thead><tr><th style={th}>Patient</th><th style={th}>Plan</th><th style={th}>Card photo</th><th style={th}>State</th><th style={th}>Action</th></tr></thead>
            <tbody>
              {rows.map(({ p, state }) => {
                const plan = w.plans.find((x) => x.id === p.insurance?.planId);
                return (
                  <tr key={p.id}>
                    <td style={td}><span className="tnum" style={{ fontWeight: 600 }}>{p.ref}</span></td>
                    <td style={td}>{plan ? `${plan.carrier}, ${plan.name}` : "—"}<br /><span style={{ color: T.inkMuted }}>ID ending {p.insurance?.memberIdLast4}</span></td>
                    <td style={td}>{p.insurance?.cardCapturedAt ? ago(p.insurance.cardCapturedAt, now) : "—"}</td>
                    <td style={td}><StatusPill tone={state.tone} label={state.label} size="sm" />{p.insurance?.issue && <p style={{ margin: "4px 0 0", color: T.inkMuted }}>{p.insurance.issue}</p>}</td>
                    <td style={td}>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => run({ ...OPS, type: "verifyInsurance", patientId: p.id }, `${p.ref}: coverage verified.`)}>Mark verified</Button>
                        <input aria-label={`Issue for ${p.ref}`} placeholder="What's wrong" value={issue[p.id] ?? ""} onChange={(e) => setIssue({ ...issue, [p.id]: e.target.value })} style={{ ...inputStyle, minHeight: 32, width: 170, fontSize: SIZE.sm, padding: "4px 8px" }} />
                        <Button size="sm" variant="secondary" onClick={() => run({ ...OPS, type: "flagInsurance", patientId: p.id, issue: issue[p.id] ?? "" }, `${p.ref}: issue sent to the patient.`)}>Flag issue</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

export function WaitlistAndOffers({ w, now, run }: { w: World; now: string; run: Run }) {
  const waiting = w.referrals
    .filter((r) => r.status === "on_waitlist" || r.status === "offered")
    .sort((a, b) => Number(b.urgent) - Number(a.urgent) || (a.waitlistSince ?? "").localeCompare(b.waitlistSince ?? ""));
  const offers = [...w.offers].reverse();
  const ref = (id: string) => w.patients.find((p) => p.id === id);
  return (
    <div className="flex flex-col gap-4">
      <Panel title="Waitlist" meta="Ops only. Practices never see this list or pick patients.">
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 720 }}>
            <thead><tr><th style={th}>Patient</th><th style={th}>Specialty</th><th style={th}>Status</th><th style={th}>Waiting</th><th style={th}>Urgent</th><th style={th}>Preferences</th></tr></thead>
            <tbody>
              {waiting.map((r) => {
                const p = ref(r.patientId);
                return (
                  <tr key={r.id}>
                    <td style={td}><span className="tnum" style={{ fontWeight: 600 }}>{p?.ref}</span>{p?.hasApp && <span style={{ color: T.inkMuted }}> · has the app</span>}</td>
                    <td style={td}>{SPECIALTY[r.specialty].label}</td>
                    <td style={td}><StatusPill tone={REFERRAL_STATUS[r.status].tone} label={REFERRAL_STATUS[r.status].label} size="sm" /></td>
                    <td style={td}>{daysWaiting(r.waitlistSince, now)}</td>
                    <td style={td}>{r.urgent ? "Yes (PCP flag)" : "No"}</td>
                    <td style={{ ...td, color: T.inkMuted }}>
                      {p ? `${p.prefs.maxMiles} mi · telehealth ${p.prefs.telehealth ? "yes" : "no"} · ${p.prefs.minNoticeHours} h notice${p.prefs.paused ? " · paused" : ""}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Offers" meta="Order: PCP urgency flag, then longest waiting, then nearest. Never payer or fee.">
        {offers.length === 0 ? (
          <Empty>No offers yet. Post a cancellation in the specialist portal.</Empty>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 760 }}>
              <thead><tr><th style={th}>Offer</th><th style={th}>Slot</th><th style={th}>Patient</th><th style={th}>Round</th><th style={th}>Status</th><th style={th}>Hold</th><th style={th}>Simulate</th></tr></thead>
              <tbody>
                {offers.map((o) => {
                  const slot = w.slots.find((s) => s.id === o.slotId);
                  const p = ref(o.patientId);
                  const live = o.status === "pending";
                  return (
                    <tr key={o.id}>
                      <td style={td} className="tnum">{o.id}</td>
                      <td style={td}>{slot ? `${when(slot.startsAt)} · ${nameOf(w, slot.practiceId)}` : "—"}</td>
                      <td style={td} className="tnum">{p?.ref}</td>
                      <td style={td}>{o.round}</td>
                      <td style={td}><StatusPill tone={OFFER_STATUS[o.status].tone} label={OFFER_STATUS[o.status].label} size="sm" /></td>
                      <td style={td} className="tnum">{live ? `${formatLeft(new Date(o.expiresAt).getTime() - new Date(now).getTime())} left${w.clock.pausedAt ? " (paused)" : ""}` : "—"}</td>
                      <td style={td}>
                        {live && p && !p.hasApp ? (
                          <div className="flex gap-2">
                            <Button size="sm" variant="secondary" onClick={() => run({ ...OPS, type: "simulateReply", offerId: o.id, accept: true }, `${p.ref} accepted (simulated).`)}>Accept</Button>
                            <Button size="sm" variant="quiet" onClick={() => run({ ...OPS, type: "simulateReply", offerId: o.id, accept: false }, `${p.ref} declined (simulated).`)}>Decline</Button>
                          </div>
                        ) : (
                          <span style={{ color: T.inkMuted, fontSize: SIZE.sm }}>{live ? "Answer in the patient app" : ""}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
