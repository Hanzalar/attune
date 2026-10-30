import type { ReactNode } from "react";
import { DEMO_PATIENT, referralRequirement } from "@attune/domain";
import { RADIUS, SIZE, T } from "../design/tokens";
import { Phone } from "./Phone";
import booked from "./screens/ref-booked.webp";
import choose from "./screens/ref-choose.webp";
import closed from "./screens/ref-closed.webp";
import dossier from "./screens/dossier.webp";
import review from "./screens/ref-review.webp";
import sent from "./screens/ref-sent.webp";
import share from "./screens/ref-share.webp";
import waiting from "./screens/ref-waiting.webp";

const Tap = ({ children }: { children: ReactNode }) => <b style={{ color: T.brand }}>{children}</b>;
const Aside = ({ children }: { children: ReactNode }) => (
  <div className="px-4 py-3" style={{ background: T.sunken, borderRadius: RADIUS.md, fontSize: SIZE.body - 1, color: T.textMuted, maxWidth: "62ch" }}>{children}</div>
);

interface Step {
  who: string;
  title: string;
  /** Someone else acts on this step; the patient waits. */
  wait?: boolean;
  body: ReactNode;
  screens: { src: string; alt: string; caption?: string }[];
}

const plan = referralRequirement(DEMO_PATIENT.plan);

const STEPS: Step[] = [
  {
    who: "You choose", title: "Pick a gynecologist and a time",
    body: (
      <>
        <p>Open the <b>Referral</b> tab. At the top, Attune says why a specialist visit makes sense now. For {DEMO_PATIENT.firstName}, her last five cycles all ran longer than 35 days.</p>
        <p>Below that are gynecologists in your insurance network. Each card shows the distance, whether they often see PMOS patients, and their next openings. Tap a time to pick it. Attune holds that time while your primary care office signs off.</p>
        <Aside><b style={{ color: T.text }}>How the list is ordered:</b> by your network, soonest opening, PMOS experience and distance. Doctors who don't work with Attune show up too.</Aside>
      </>
    ),
    screens: [{ src: choose, alt: "Step 1 of 3: a 'Why now' note above doctor cards, each with an In network label, distance and tappable times; one time is selected." }],
  },
  {
    who: "You choose", title: "Choose what gets shared",
    body: (
      <>
        <p>Check the records you want in your packet: your tracker summary, photo trend, notes from your primary care portal, lab results and files you've uploaded. Anything you uncheck stays private. Each item shows where it came from.</p>
        <p>Tap <Tap>Preview what the doctor sees</Tap> for the one-page summary. It uses medical terms because it's written for your doctors, and it says plainly that Attune doesn't diagnose.</p>
      </>
    ),
    screens: [
      { src: share, alt: "Step 2 of 3: five checked records, each with its source, and an option to be offered an earlier cancellation." },
      { src: dossier, alt: "The clinician summary, listing each piece of evidence with its source and status.", caption: "The summary preview" },
    ],
  },
  {
    who: "You approve", title: "Review and send",
    body: (
      <>
        <p>One screen shows the doctor, your held time, what's shared and your insurance. Tap <Tap>Send to my PCP for sign-off</Tap>. This is when you give permission, and the packet goes only to your primary care office.</p>
        <Aside><b style={{ color: T.text }}>Do I even need a referral?</b> Attune reads your plan type. For {DEMO_PATIENT.firstName}: "{plan.patientNote}" Your primary care office confirms your actual plan.</Aside>
      </>
    ),
    screens: [{ src: review, alt: "Step 3 of 3: a summary of doctor, held time, shared items and insurance, what happens next, and a 'Send to my PCP for sign-off' button." }],
  },
  {
    who: "Your primary care office · you wait", title: "Your primary care office signs off", wait: true,
    body: (
      <>
        <p>A medical assistant checks the packet and signs. Some plans, like HMOs, also need your doctor's signature. Your appointment card says what you're waiting on.</p>
        <p>Changed your mind? Tap <Tap>Stop sharing and pull it back</Tap>. Nothing has reached the gynecologist yet.</p>
      </>
    ),
    screens: [{ src: waiting, alt: "Appointment card for Thu, Nov 12 at 2:40 PM, marked held and 'Waiting on your PCP's office', above the progress list with PCP sign-off as the current step." }],
  },
  {
    who: "Attune · you wait", title: "Attune sends it to the gynecologist", wait: true,
    body: <p>As soon as your primary care office signs, Attune sends your packet the way that office already takes referrals, usually by secure fax, and gets a receipt. You can see it arrived, so there's no need to call.</p>,
    screens: [{ src: sent, alt: "Appointment card labelled 'With North Dallas Women's Care' and a progress list with the first four steps done." }],
  },
  {
    who: "The gynecologist's office · you're booked", title: "The office confirms your time", wait: true,
    body: (
      <>
        <p>The front desk confirms the time you held, and your appointment shows <b>Booked</b>. Your summary is already with them, so you'll spend less of the visit retelling your history.</p>
        <Aside><b style={{ color: T.text }}>If your time is taken,</b> the office offers another and you tap <b>Book</b> to accept it. If they can't take you, you'll see their note.</Aside>
      </>
    ),
    screens: [{ src: booked, alt: "Appointment card labelled Booked for Thu, Nov 12 at 2:40 PM, with an 'I had my visit' button." }],
  },
  {
    who: "You confirm · Attune follows up", title: "After your visit",
    body: <p>Tap <Tap>I had my visit</Tap>. Attune lets your primary care office know, so both offices stay in the loop and nobody loses track of you.</p>,
    screens: [{ src: closed, alt: "Appointment card labelled Visit done and a progress list with every step checked." }],
  },
];

export function ReferralSteps() {
  return (
    <ol className="flex flex-col" style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {STEPS.map((s, i) => (
        <li key={s.title} className="grid gap-x-6 gap-y-5 grid-cols-[36px_minmax(0,1fr)] lg:grid-cols-[36px_minmax(0,1fr)_auto] items-start py-9"
          style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}>
          <span className="flex items-center justify-center tnum"
            style={{ width: 36, height: 36, borderRadius: RADIUS.md, background: s.wait ? T.sunken : T.brand, color: s.wait ? T.textMuted : T.textOnBrand, border: s.wait ? `1px solid ${T.border}` : "none", fontSize: SIZE.md, fontWeight: 600 }}>
            {i + 1}
          </span>
          <div className="flex flex-col gap-3" style={{ minWidth: 0, maxWidth: "62ch", fontSize: SIZE.body, lineHeight: 1.6, color: T.text }}>
            <span style={{ fontSize: SIZE.sm, fontWeight: 600, color: T.brand }}>{s.who}</span>
            <h3 style={{ fontSize: SIZE.lg, fontWeight: 600, color: T.text, lineHeight: 1.3 }}>{s.title}</h3>
            {s.body}
          </div>
          <div className="col-span-2 lg:col-span-1 flex flex-wrap justify-center gap-4">
            {s.screens.map((sc) => <Phone key={sc.src} {...sc} max={s.screens.length > 1 ? 220 : 250} />)}
          </div>
        </li>
      ))}
    </ol>
  );
}
