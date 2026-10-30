import { useState } from "react";
import { ArrowLeft, ArrowRight, Eye, Hourglass, Send } from "lucide-react";
import {
  DEMO_SHARE_ITEMS, DEMO_SPECIALISTS, rankSpecialists, referralRequirement, type Referral, type Slot,
} from "@attune/domain";
import { RADIUS, SIZE, T } from "../../design/tokens";
import { EVIDENCE } from "../../shared/Dossier";
import { useAct } from "../../shared/loop";
import { Button, Card, Chip, Label, Notice, Stepper } from "../../shared/ui";
import { PageTitle } from "../Tracker";
import { ProviderCard, slotLong } from "./ProviderCard";

const STEPS = ["Doctor and time", "What's shared", "Review"];

/** Three short steps, one decision each, like booking any appointment. Nothing leaves Attune until step 3. */
export function Booking({ r, show, openDossier }: { r: Referral; show: (m: string, e?: boolean) => void; openDossier: () => void }) {
  const run = useAct(show);
  const [step, setStep] = useState(0);
  const matches = rankSpecialists(DEMO_SPECIALISTS, r.plan, 3);
  const chosen = DEMO_SPECIALISTS.find((s) => s.id === r.specialistId) ?? null;
  const shared = DEMO_SHARE_ITEMS.filter((i) => r.share[i.key]);
  const coverage = referralRequirement(r.plan);
  const ovulatory = EVIDENCE.criteria.find((c) => c.id === "ovulatory");
  // A doctor with openings needs a picked time; a waitlist-only doctor needs only the choice.
  const doctorReady = chosen !== null && (chosen.openSlots.length === 0 || r.requestedSlot !== null);

  const pick = (specialistId: string, slot: Slot | null) => {
    if (specialistId !== r.specialistId) run({ type: "chooseSpecialist", by: "patient", specialistId });
    if (slot) run({ type: "holdSlot", by: "patient", slot });
    else if (!r.waitlist) run({ type: "setWaitlist", by: "patient", on: true });
  };

  const next = step === 0
    ? { label: "Continue", on: () => setStep(1), ok: doctorReady, why: "Pick a time to continue." }
    : step === 1
      ? { label: "Continue", on: () => setStep(2), ok: shared.length > 0, why: "Share at least one item." }
      : { label: "Send to my PCP for sign-off", on: () => run({ type: "approveSharing", by: "patient" }, "Sent to your PCP's office. Your time is held."), ok: true, why: "" };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle title="Book a gynecologist" sub="Your PCP's office signs off before anything is sent." />
      <Stepper steps={STEPS} current={step} />
      {r.consent.revokedAt && <Notice tone="info" title="Sharing stopped">Nothing was sent to the gynecologist. Your choices are still here if you want to send again.</Notice>}

      {step === 0 && (
        <>
          <Notice tone="warning" title="Why now">{ovulatory?.detail} {EVIDENCE.gaps[0]} not on file yet. A gynecologist can finish the workup.</Notice>
          <p style={{ fontSize: SIZE.sm, color: T.textMuted }}>{coverage.patientNote}</p>
          {matches.map((m) => (
            <ProviderCard key={m.specialist.id} match={m} selected={m.specialist.id === r.specialistId} held={r.requestedSlot} locked={false}
              onPickSlot={(s) => pick(m.specialist.id, s)} onWaitlist={() => pick(m.specialist.id, null)} />
          ))}
          <p style={{ fontSize: SIZE.xs + 1, color: T.textMuted }}>Ranked by your network, soonest opening, PMOS experience and distance. Never by who pays Attune.</p>
        </>
      )}

      {step === 1 && (
        <>
          <h2 style={{ fontSize: SIZE.md, fontWeight: 600, color: T.text }}>Choose what's shared</h2>
          <p style={{ fontSize: SIZE.body - 1, color: T.textMuted }}>Only what you check goes in the packet. Each item shows where it came from.</p>
          <div className="flex flex-col gap-2">
            {DEMO_SHARE_ITEMS.map((item) => (
              <label key={item.key} htmlFor={`share-${item.key}`} className="flex items-center gap-3 px-3 py-2.5"
                style={{ minHeight: 56, background: T.surface, border: `1px solid ${r.share[item.key] ? T.brand : T.border}`, borderRadius: RADIUS.md, cursor: "pointer" }}>
                <input id={`share-${item.key}`} type="checkbox" checked={r.share[item.key]} onChange={() => run({ type: "toggleShare", by: "patient", key: item.key })}
                  style={{ width: 20, height: 20, accentColor: T.brand, flexShrink: 0 }} />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: "block", fontSize: SIZE.body - 1, color: T.text, fontWeight: 600 }}>{item.title}</span>
                  <span style={{ display: "block", fontSize: SIZE.sm - 1, color: T.textMuted }}>{item.detail}</span>
                </span>
                <Chip>{item.source}</Chip>
              </label>
            ))}
          </div>
          <Button kind="quiet" onClick={openDossier}><Eye size={16} aria-hidden /> Preview what the doctor sees</Button>
          <label htmlFor="waitlist" className="flex items-center gap-3 px-3 py-2.5" style={{ minHeight: 56, background: T.surface, border: `1px solid ${T.border}`, borderRadius: RADIUS.md, cursor: "pointer" }}>
            <Hourglass size={18} color={T.brand} aria-hidden />
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: SIZE.body - 1, fontWeight: 600, color: T.text }}>Offer me an earlier cancellation</span>
              <span style={{ display: "block", fontSize: SIZE.sm - 1, color: T.textMuted }}>If a sooner time opens, we'll offer it to you first.</span>
            </span>
            <input id="waitlist" type="checkbox" checked={r.waitlist} onChange={() => run({ type: "setWaitlist", by: "patient", on: !r.waitlist })} style={{ width: 20, height: 20, accentColor: T.brand }} />
          </label>
        </>
      )}

      {step === 2 && chosen && (
        <>
          <h2 style={{ fontSize: SIZE.md, fontWeight: 600, color: T.text }}>Review and send</h2>
          <Card pad={0}>
            <dl style={{ fontSize: SIZE.body - 1 }}>
              {([
                ["Doctor", `${chosen.name}, ${chosen.practice}`],
                ["Time", r.requestedSlot ? `${slotLong(r.requestedSlot)} · held` : "Waitlist · next opening"],
                ["Shared", `${shared.length} of ${DEMO_SHARE_ITEMS.length}: ${shared.map((i) => i.title.split(" ·")[0]).join(", ")}`],
                ["Insurance", `${r.plan} · ${chosen.network === "in" ? "in network" : "out of network"}`],
              ] as const).map(([k, v], i) => (
                <div key={k} className="grid gap-1 px-4 py-3" style={{ gridTemplateColumns: "88px minmax(0,1fr)", borderTop: i ? `1px solid ${T.border}` : "none" }}>
                  <dt style={{ color: T.textMuted }}>{k}</dt><dd style={{ color: T.text, fontWeight: 500 }}>{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card>
            <Label>What happens next</Label>
            <ol className="mt-2 flex flex-col gap-2" style={{ listStyle: "decimal", paddingLeft: 20, fontSize: SIZE.body - 1, color: T.text }}>
              <li>Your PCP's office checks the packet and signs. {coverage.physicianSignature ? "Your plan also needs your doctor's signature." : ""}</li>
              <li>Attune sends it to {chosen.practice} the way they take referrals, and gets a receipt.</li>
              <li>{r.requestedSlot ? "They confirm your held time, or offer another one." : "They offer you a time."}</li>
            </ol>
          </Card>
          <p style={{ fontSize: SIZE.sm, color: T.textMuted }}>You can stop sharing at any time from the next screen.</p>
        </>
      )}

      <div className="sticky flex flex-col gap-2 pt-3 pb-3" style={{ bottom: "calc(66px + env(safe-area-inset-bottom, 0px))", background: T.canvas, borderTop: `1px solid ${T.border}` }}>
        {step === 0 && chosen && (
          <p style={{ fontSize: SIZE.sm, color: T.text }}><b>{chosen.name.replace(/\s*\(.*\)$/, "")}</b>{r.requestedSlot ? ` · ${slotLong(r.requestedSlot)}` : chosen.openSlots.length === 0 ? " · waitlist" : ""}</p>
        )}
        {!next.ok && <p style={{ fontSize: SIZE.sm, color: T.textMuted }}>{step === 0 && !chosen ? "Pick a doctor and a time to continue." : next.why}</p>}
        <div className="flex gap-2">
          {step > 0 && <Button size="lg" onClick={() => setStep(step - 1)} label="Back"><ArrowLeft size={18} aria-hidden /></Button>}
          <div className="flex-1">
            <Button kind="primary" size="lg" full disabled={!next.ok} onClick={next.on}>
              {step === 2 && <Send size={18} aria-hidden />} {next.label} {step < 2 && <ArrowRight size={18} aria-hidden />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
