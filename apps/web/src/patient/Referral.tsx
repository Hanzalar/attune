import { ArrowRight, BellRing, Check, Clock, Hourglass, MapPin, ShieldCheck, Undo2 } from "lucide-react";
import {
  DEMO_SHARE_ITEMS, DEMO_SPECIALISTS, rankSpecialists, referralRequirement, type Referral,
} from "@attune/domain";
import { EVIDENCE } from "../shared/Dossier";
import { StageList, useAct } from "../shared/loop";
import { C, SERIF } from "../shared/theme";
import { Eyebrow } from "../shared/ui";

const card = { background: C.white, border: `1px solid ${C.line}` };

export function ReferralTab({ r, show, openDossier }: { r: Referral; show: (m: string, e?: boolean) => void; openDossier: () => void }) {
  const run = useAct(show);
  const matches = rankSpecialists(DEMO_SPECIALISTS, r.plan, 3);
  const locked = r.stage !== "draft";
  const coverage = referralRequirement(r.plan);
  const ovulatory = EVIDENCE.criteria.find((c) => c.id === "ovulatory");
  const consentActive = r.consent.grantedAt !== null && r.consent.revokedAt === null && !["closed", "declined", "withdrawn"].includes(r.stage);

  const cta = (() => {
    switch (r.stage) {
      case "draft": return { label: "Approve and send to my PCP", on: () => run({ type: "approveSharing", by: "patient" }, "Sent to your PCP for sign-off"), color: C.coral };
      case "awaiting_pcp":
      case "awaiting_physician": return { label: "Waiting on your PCP's sign-off", wait: true };
      case "signed":
      case "sent": return { label: "Waiting on the OB/GYN to reply", wait: true };
      case "offered": return { label: `Book ${r.offeredSlot?.label}`, on: () => run({ type: "bookSlot", by: "patient" }, "Booked. Intake summary sent ahead"), color: C.coral };
      case "booked": return { label: "Mark visit done", on: () => run({ type: "completeVisit", by: "patient", outcome: "Patient reported the visit happened." }, "Outcome sent back to your PCP"), color: C.ink };
      case "declined": return { label: "Declined · pick another gyno after reset", done: true };
      case "withdrawn": return { label: "Withdrawn · nothing more is shared", done: true };
      default: return { label: "Loop closed · next check-in set", done: true };
    }
  })();

  return (
    <div>
      <p style={{ fontFamily: SERIF, fontSize: 24, color: C.ink, marginTop: 6 }}>Your referral</p>
      <p style={{ color: C.slate, fontSize: 13.5, marginTop: 4 }}>PCP to OB/GYN. Attune does the legwork; you approve each step.</p>

      <div className="rounded-3xl p-4 mt-4 flex gap-3" style={{ background: C.amberSoft }}>
        <BellRing size={18} color={C.amber} style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.45 }}>
          <b>Why now:</b> {ovulatory?.detail} {EVIDENCE.gaps[0]} not on file yet. A gyno visit can complete your workup.
        </p>
      </div>

      <div className="rounded-3xl p-5 mt-4" style={card}>
        <Eyebrow color={C.plum}>Status</Eyebrow>
        <div className="mt-3"><StageList r={r} /></div>
      </div>

      <div className="rounded-3xl p-5 mt-4" style={card}>
        <Eyebrow color={C.plum}>Matched OB/GYNs</Eyebrow>
        <p style={{ fontSize: 11.5, color: C.slate2, marginTop: 4 }}>Ranked by your network, soonest opening, PMOS experience and distance. Never by who pays Attune.</p>
        <div className="mt-3 flex flex-col gap-2">
          {matches.map(({ specialist: m, reasons }) => {
            const on = m.id === r.specialistId;
            return (
              <button key={m.id} disabled={locked} aria-pressed={on} onClick={() => run({ type: "chooseSpecialist", by: "patient", specialistId: m.id })} className="text-left rounded-2xl p-3"
                style={{ background: on ? C.coralSoft : C.patientBg, border: `1.5px solid ${on ? C.coral : C.line}`, cursor: locked ? "default" : "pointer", opacity: locked && !on ? 0.55 : 1 }}>
                <div className="flex items-start justify-between gap-2">
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{m.name}</div>
                    <div style={{ fontSize: 11.5, color: C.slate }}>{m.practice}</div>
                  </div>
                  {on && <div className="rounded-full flex items-center justify-center" style={{ width: 20, height: 20, background: C.coral, flexShrink: 0 }}><Check size={12} color="white" /></div>}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2" style={{ fontSize: 11.5, color: C.slate }}>
                  <span className="flex items-center gap-1" style={{ color: C.green, fontWeight: 600 }}><ShieldCheck size={12} /> {reasons[0]}</span>
                  <span className="flex items-center gap-1 tnum"><Clock size={12} /> {m.soonestLabel}</span>
                  <span className="flex items-center gap-1 tnum"><MapPin size={12} /> {m.miles} mi</span>
                  <span>{m.fitNote}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl p-5 mt-4" style={card}>
        <div className="flex items-center justify-between">
          <Eyebrow color={C.plum}>What gets shared</Eyebrow>
          <button onClick={openDossier} style={{ fontSize: 11.5, color: C.plum, fontWeight: 600, cursor: "pointer" }}>Preview packet</button>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {DEMO_SHARE_ITEMS.map((item) => (
            <label key={item.key} htmlFor={`share-${item.key}`} className="flex items-center gap-3 rounded-2xl px-3 py-2.5" style={{ background: C.patientBg, border: `1px solid ${C.line}`, cursor: locked ? "default" : "pointer" }}>
              <input id={`share-${item.key}`} type="checkbox" checked={r.share[item.key]} disabled={locked}
                onChange={() => run({ type: "toggleShare", by: "patient", key: item.key })} style={{ width: 17, height: 17, accentColor: C.coral }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, color: C.ink, fontWeight: 600 }}>{item.title}</div>
                <div style={{ fontSize: 11, color: C.slate2 }}>{item.detail}</div>
              </div>
            </label>
          ))}
        </div>
        <div className="rounded-2xl p-3 mt-3 flex gap-2.5" style={{ background: C.mist }}>
          <ShieldCheck size={16} color={C.plum} style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 11.5, color: C.slate, lineHeight: 1.45 }}>{coverage.patientNote}</p>
        </div>
      </div>

      <label htmlFor="waitlist" className="rounded-3xl p-4 mt-4 flex items-center gap-3" style={{ ...card, cursor: "pointer" }}>
        <Hourglass size={18} color={C.plum} />
        <div className="flex-1">
          <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>Take an earlier cancellation</div>
          <div style={{ fontSize: 11.5, color: C.slate2 }}>We'll offer you a slot if one opens before your booking.</div>
        </div>
        <input id="waitlist" type="checkbox" checked={r.waitlist} onChange={() => run({ type: "setWaitlist", by: "patient", on: !r.waitlist })} style={{ width: 18, height: 18, accentColor: C.coral }} />
      </label>

      {"on" in cta ? (
        <button onClick={cta.on} className="w-full rounded-2xl py-3.5 mt-4 flex items-center justify-center gap-2" style={{ background: cta.color, color: "white", cursor: "pointer", fontWeight: 700, fontSize: 15 }}>
          {cta.label} <ArrowRight size={17} />
        </button>
      ) : (
        <div className="w-full rounded-2xl py-3.5 mt-4 flex items-center justify-center gap-2" style={{ background: cta.done ? C.greenSoft : C.mist, color: cta.done ? C.green : C.plum, fontWeight: 700, fontSize: 14 }}>
          {cta.done ? <Check size={17} /> : <Hourglass size={16} />} {cta.label}
        </div>
      )}

      {consentActive && (
        <button onClick={() => run({ type: "revokeConsent", by: "patient" }, "Consent withdrawn")} className="w-full mt-3 flex items-center justify-center gap-1.5" style={{ fontSize: 12.5, color: C.slate, cursor: "pointer" }}>
          <Undo2 size={14} /> Stop sharing{r.stage === "awaiting_pcp" || r.stage === "awaiting_physician" || r.stage === "signed" ? " and pull the request back" : ""}
        </button>
      )}
    </div>
  );
}
