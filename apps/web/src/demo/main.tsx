/**
 * Demo hub: the handoff's scenario as a live checklist. Each step ticks itself off from the shared record, so the
 * presenter always knows what to do next and in which view.
 */
import type { ReactNode } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { DEMO_IDS, DEMO_PEOPLE, PRODUCT_NAME, type World } from "@attune/domain";
import { Bloom, Wordmark } from "../shared/Brand";
import { ClockControls } from "../shared/ClockControls";
import { DemoBar, mount } from "../shared/DemoBar";
import { useWorld, viewUrl, type View } from "../shared/store";
import { Ink, Overline, Panel, Voice, td, th, useAct, useToast } from "../shared/ui";
import { RADIUS, SIZE, T } from "../design/tokens";

interface Step {
  title: string;
  who: string;
  how: ReactNode;
  view: View;
  hash?: string;
  done: (w: World) => boolean;
}

const ariEndo = (w: World) => w.referrals.filter((r) => r.patientId === DEMO_IDS.patient && r.specialty === "endo" && r.route === "attune").at(-1);
const PAST_WAITLIST = ["on_waitlist", "offered", "booked", "seen", "summary_received", "closed"];

const STEPS: Step[] = [
  {
    title: "Ari's PCP refers her to an endocrinologist. Her record and insurance are ready, so she is on the waitlist.",
    who: `${DEMO_PEOPLE.ma} and ${DEMO_PEOPLE.physician}`,
    how: "Already done when you start at the fill. From a fresh install: onboard Ari, share with her doctor, look her up in the PCP portal, build and sign the referral, add her card, then mark it verified in Ops.",
    view: "pcp",
    hash: "board",
    done: (w) => PAST_WAITLIST.includes(ariEndo(w)?.status ?? ""),
  },
  {
    title: "The endo's office posts a cancellation for tomorrow afternoon.",
    who: `${DEMO_PEOPLE.frontDesk}, front desk`,
    how: "Specialist portal → Openings → Post. The default time is the next weekday at 2:40 PM. The front desk never sees who is waiting.",
    view: "specialist",
    done: (w) => w.slots.some((s) => s.practiceId === DEMO_IDS.endo),
  },
  {
    title: "Ari gets an offer with a countdown and accepts.",
    who: DEMO_PEOPLE.patient,
    how: "Patient app → the offer sits at the top of Home. Accepting is her consent to share her Patient Pack with that office. Pause timers below if you need more time.",
    view: "patient",
    done: (w) => ["booked", "seen", "summary_received", "closed"].includes(ariEndo(w)?.status ?? ""),
  },
  {
    title: "The front desk opens her Patient Pack. She doesn't retell her story.",
    who: `${DEMO_PEOPLE.frontDesk}, front desk`,
    how: "Specialist portal → the filled opening → Open Patient Pack. The view is logged, and Ari can see it under Record.",
    view: "specialist",
    done: (w) => w.views.some((v) => v.patientId === DEMO_IDS.patient && v.recipientId === DEMO_IDS.endo),
  },
  {
    title: "The endo uploads a visit summary. It lands in Ari's record and the PCP's inbox, and the referral closes.",
    who: DEMO_PEOPLE.endo,
    how: "Use “Skip to the booked visit” below, then Specialist portal → Mark attended → Upload visit summary. Check Ari's Home and the PCP Inbox.",
    view: "specialist",
    done: (w) => ariEndo(w)?.status === "closed",
  },
  {
    title: "The ledger shows one fee owed by the endo's practice and nothing owed by anyone else.",
    who: "Attune ops",
    how: "Ops → Fee ledger. Nothing is charged; PCPs and patients show $0.00 by design.",
    view: "ops",
    hash: "ledger",
    done: (w) => w.ledger.some((l) => l.practiceId === DEMO_IDS.endo),
  },
];

const REAL_VS_FAKE: [string, string][] = [
  ["Matching, offers, hold timers, statuses", "Real rules (packages/domain), with a demo speed that turns minutes into seconds"],
  ["Insurance check", "Mocked: an operator marks it verified in Ops"],
  ["EMR", "None. The Patient Pack prints to PDF and has a secure link that works in this browser"],
  ["Off-network specialist", "Mocked fax or Direct send; the packet is shown, not transmitted"],
  ["Notifications", "In-app banners carrying the exact SMS text, with no health details"],
  ["Fee ledger", "Accrues, charges nothing"],
];

function App() {
  const w = useWorld();
  const [toast, show] = useToast();
  const run = useAct(show);
  const next = STEPS.findIndex((s) => !s.done(w));

  return (
    <div style={{ minHeight: "100vh", background: T.bone }}>
      <DemoBar here="demo" />
      <Bloom variant="wine" style={{ padding: "28px 20px 72px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <Wordmark onDark size={26} sub="Prototype" />
          <Overline onDark style={{ marginTop: 28 }}>Demo hub · synthetic data</Overline>
          <Voice size={SIZE.display} color={T.cream} style={{ marginTop: 8, maxWidth: 760 }}>A cancellation, filled by someone ready.</Voice>
          <p style={{ color: T.blush, fontSize: SIZE.md, maxWidth: 680, margin: "14px 0 0", lineHeight: 1.45 }}>
            {PRODUCT_NAME} is a patient-owned record her PCP, gyno and endo all see. When a specialist has a cancellation, {PRODUCT_NAME} offers it to a
            patient who is already PCP-qualified, insurance-checked and ready.
          </p>
        </div>
      </Bloom>
      <main style={{ maxWidth: 1080, margin: "-40px auto 0", padding: "0 16px 64px" }} className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Panel title="The scenario" meta={next === -1 ? "All six steps done" : `Step ${next + 1} of ${STEPS.length} is next`}>
          <ol className="flex flex-col" style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {STEPS.map((s, i) => {
              const done = s.done(w);
              const current = i === next;
              return (
                <li key={s.title} aria-current={current ? "step" : undefined} className="grid gap-3" style={{ gridTemplateColumns: "32px 1fr", padding: "14px 0", borderTop: i ? `1px solid ${T.hairline}` : undefined }}>
                  <span aria-hidden className="flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 14, background: done ? T.forest : current ? T.wine : "transparent", border: `1.5px solid ${done ? T.forest : current ? T.wine : T.line}`, color: T.cream, fontSize: SIZE.sm, fontWeight: 600 }}>
                    {done ? <Check size={15} strokeWidth={2.6} /> : <span style={{ color: current ? T.cream : T.inkMuted }}>{i + 1}</span>}
                  </span>
                  <div>
                    <p style={{ margin: 0, fontSize: SIZE.body, fontWeight: 600, color: T.forest }}>
                      {s.title} {done && <span style={{ fontSize: SIZE.sm, color: T.inkMuted, fontWeight: 500 }}>Done</span>}
                      {current && <span style={{ fontSize: SIZE.xs, color: T.raspberry, letterSpacing: "0.12em", textTransform: "uppercase", marginLeft: 6 }}>Next</span>}
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: SIZE.sm, color: T.inkMuted }}>{s.who} · {s.how}</p>
                    <a href={viewUrl(s.view, s.hash)} target={`attune-${s.view}`} className="inline-flex items-center gap-1" style={{ marginTop: 6, fontSize: SIZE.sm, fontWeight: 600, color: T.raspberry }}>
                      Open the {s.view === "pcp" ? "PCP portal" : s.view === "ops" ? "ops screen" : s.view === "patient" ? "patient app" : "specialist portal"} <ArrowUpRight size={14} aria-hidden />
                    </a>
                  </div>
                </li>
              );
            })}
          </ol>
          {next === -1 && <Ink style={{ marginTop: 8 }}>that's the whole loop.</Ink>}
        </Panel>
        <div className="flex flex-col gap-4">
          <Panel title="Run it">
            <ClockControls run={run} />
            <p style={{ fontSize: SIZE.sm, color: T.inkMuted, margin: "12px 0 0" }}>
              Open each view in its own window. Put the patient app at phone width. Every view shares one record in this browser and updates live.
            </p>
          </Panel>
          <Panel title="Cast">
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: SIZE.sm, lineHeight: 1.7 }}>
              <li>{DEMO_PEOPLE.patient}, patient</li>
              <li>{DEMO_PEOPLE.ma}, PCP medical assistant</li>
              <li>{DEMO_PEOPLE.physician}, PCP physician</li>
              <li>{DEMO_PEOPLE.frontDesk}, endo front desk</li>
              <li>{DEMO_PEOPLE.endo}, endocrinologist</li>
            </ul>
            <p style={{ fontSize: SIZE.sm, color: T.inkMuted, margin: "8px 0 0" }}>Every person, practice and plan is invented.</p>
          </Panel>
        </div>
        <Panel title="What's real and what's faked" style={{ gridColumn: "1 / -1" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 520 }}>
              <thead><tr><th style={th}>Piece</th><th style={th}>In this prototype</th></tr></thead>
              <tbody>{REAL_VS_FAKE.map(([k, v]) => <tr key={k}><td style={{ ...td, fontWeight: 600 }}>{k}</td><td style={td}>{v}</td></tr>)}</tbody>
            </table>
          </div>
          <p style={{ fontSize: SIZE.sm, color: T.inkMuted, margin: "10px 0 0", borderRadius: RADIUS.sm }}>
            Not in the prototype: community features, the daily note, real EMR connections, real billing, and anything that diagnoses or recommends treatment.
          </p>
        </Panel>
      </main>
      {toast}
    </div>
  );
}

mount(App);
