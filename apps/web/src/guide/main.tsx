import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { DEMO_PATIENT } from "@attune/domain";
import "../index.css";
import { RADIUS, SIZE, T } from "../design/tokens";
import { Wordmark } from "../shared/Brand";
import { viewUrl } from "../shared/store";
import { Eyebrow, Notice } from "../shared/ui";
import { Phone } from "./Phone";
import { PresenterNotes } from "./Presenter";
import { ReferralSteps } from "./Steps";
import coach from "./screens/coach.webp";
import insights from "./screens/insights.webp";
import today from "./screens/today.webp";
import trials from "./screens/trials.webp";

const PROMISES = [
  ["You choose what's shared", "Nothing leaves Attune until you approve what goes and who gets it."],
  ["Your doctor's office signs off", "Your primary care office checks and signs every referral. Attune never signs for anyone."],
  ["Fair doctor suggestions", "Ranked by your network, soonest opening, PMOS experience and distance. Never by who pays Attune."],
  ["No diagnosis, no prescriptions", "Attune organizes your information for your doctors. Your doctors make the medical calls."],
];

/** `demo` names what is not built yet, so nobody presents it as working. */
const TABS: { name: string; src: string; alt: string; text: string; demo?: string }[] = [
  { name: "Today", src: today, text: "A 20-second check-in: rate five symptoms from 1 to 5 and tick off what you took.", demo: "Photos aren't in the demo yet",
    alt: "Today tab: five symptoms each rated on a 1 to 5 scale, and a checklist of supplements." },
  { name: "Insights", src: insights, text: "Patterns found in your own data, like acne that flares in the week before your period.",
    alt: "Insights tab: a bar chart showing acne is worst in the luteal phase." },
  { name: "Trials", src: trials, text: "Try one change for eight weeks and see whether it actually moved anything for you.", demo: "Starting a new trial isn't built yet",
    alt: "Trials tab: an eight-week inositol trial at week 6, charting doses taken against acne severity." },
  { name: "Coach", src: coach, text: "Ask about your own numbers and get questions to bring to your doctor.", demo: "Answers are pre-written in the demo",
    alt: "Coach tab: a question about inositol answered from tracked data." },
];

const WORDS = [
  ["PMOS", "Polyendocrine metabolic ovarian syndrome, the new name for PCOS. Same condition, with a name that reflects that it affects more than the ovaries."],
  ["PCP", "Your primary care provider: the doctor or office you see for checkups."],
  ["MA", "Medical assistant. At most offices, the MA puts referrals together and sends them."],
  ["OB/GYN, gyno", "A gynecologist. Many manage PMOS long term."],
  ["Referral", "A request from your primary care office asking a specialist to see you. Some insurance plans require one before they'll pay for the visit."],
  ["In network", "A doctor your insurance has a deal with, so you pay less."],
  ["Held time", "The opening you picked. Attune asks the office for it, and it's yours once the office confirms."],
  ["mFG score", "A 0-to-36 score doctors use to describe hair growth on the face and body."],
];

const h2 = { fontSize: SIZE.xxl - 2, fontWeight: 600, color: T.text, lineHeight: 1.2, textWrap: "balance" } as const;
const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: RADIUS.md };

function Section({ eyebrow, title, children }: { eyebrow?: string; title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      {eyebrow && <Eyebrow color={T.brand}>{eyebrow}</Eyebrow>}
      <h2 style={h2}>{title}</h2>
      {children}
    </section>
  );
}

function Guide() {
  return (
    <div style={{ background: T.canvas, minHeight: "100vh", color: T.text, fontSize: SIZE.body, lineHeight: 1.6 }}>
      <header style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, paddingLeft: "max(16px, env(safe-area-inset-left))", paddingRight: "max(16px, env(safe-area-inset-right))" }}>
        <div className="mx-auto flex items-center justify-between gap-3 py-3" style={{ maxWidth: 980 }}>
          <Wordmark size={28} sub="Patient walkthrough" />
          <a href={viewUrl("patient")} target="attune-patient" className="flex items-center gap-1" style={{ color: T.brand, fontWeight: 600, fontSize: SIZE.sm }}>Open the app <ArrowRight size={15} aria-hidden /></a>
        </div>
      </header>
      <main className="mx-auto flex flex-col gap-14 py-10" style={{ maxWidth: 980, paddingLeft: "max(16px, env(safe-area-inset-left))", paddingRight: "max(16px, env(safe-area-inset-right))", boxSizing: "content-box" }}>
        <div className="flex flex-col gap-4">
          <h1 style={{ fontSize: "clamp(30px, 5vw, 40px)", fontWeight: 600, lineHeight: 1.15, maxWidth: "20ch", textWrap: "balance" }}>
            Book the right gynecologist, with your history already there.
          </h1>
          <p style={{ fontSize: SIZE.md, color: T.textMuted, maxWidth: "62ch" }}>
            Attune is an app for people living with PMOS, the new name for PCOS. Day to day, it helps you track what your body is doing. When it's time to see an OB/GYN, you pick a doctor and a time like booking any appointment. Attune gathers your records, gets your primary care office to sign off, sends everything, and follows up until you're seen. You approve every step.
          </p>
          <div style={{ maxWidth: "62ch" }}>
            <Notice tone="warning" title="This is an early demo">{DEMO_PATIENT.firstName}, her doctors and her records are made up. Nothing you tap sends anything to anyone.</Notice>
          </div>
        </div>

        <Section eyebrow="Before anything else" title="You stay in charge">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {PROMISES.map(([title, text]) => (
              <div key={title} className="p-4 flex flex-col gap-2" style={card}>
                <ShieldCheck size={22} color={T.success} aria-hidden />
                <b style={{ fontSize: SIZE.body }}>{title}</b>
                <span style={{ fontSize: SIZE.sm + 1, color: T.textMuted, lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section eyebrow="Part 1 · Every day" title="Track what matters to you">
          <p style={{ maxWidth: "62ch" }}>
            You're looking at {DEMO_PATIENT.firstName}'s phone. She's {DEMO_PATIENT.age}, has tracked for about six months, and wants more regular cycles and clearer skin. Four tabs along the bottom cover her day to day.
          </p>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {TABS.map((t) => (
              <div key={t.name} className="flex flex-col gap-2.5" style={{ minWidth: 0 }}>
                <Phone src={t.src} alt={t.alt} />
                <h3 style={{ fontSize: SIZE.md, fontWeight: 600, marginTop: 4 }}>{t.name}</h3>
                <p style={{ fontSize: SIZE.sm + 1, color: T.textMuted, lineHeight: 1.5 }}>{t.text}</p>
                {t.demo && <span className="self-start px-2 py-0.5" style={{ fontSize: SIZE.xs, fontWeight: 600, background: T.sunken, color: T.textMuted, borderRadius: RADIUS.sm }}>{t.demo}</span>}
              </div>
            ))}
          </div>
        </Section>

        <Section eyebrow="Part 2 · Seeing a specialist" title="Your referral, step by step">
          <p style={{ maxWidth: "62ch" }}>Three quick steps from you, then Attune and the two offices take it from there. Grey numbers are steps where someone else acts and you just wait.</p>
          <ReferralSteps />
        </Section>

        <section className="p-6 grid gap-x-8 gap-y-4 grid-cols-1 md:grid-cols-2" style={card}>
          <h2 className="md:col-span-2" style={h2}>If you change your mind</h2>
          <div className="flex flex-col gap-1">
            <b>Before it reaches the gynecologist</b>
            <span style={{ color: T.textMuted, fontSize: SIZE.body - 1 }}>Tap Stop sharing. The request is pulled back from your primary care office and nothing leaves Attune.</span>
          </div>
          <div className="flex flex-col gap-1">
            <b>After it's sent</b>
            <span style={{ color: T.textMuted, fontSize: SIZE.body - 1 }}>Tap Stop sharing and nothing more is shared. Your held time is released. The office keeps what it already received, as with any records you've sent before.</span>
          </div>
        </section>

        <Section title="Words you'll see">
          <dl className="grid gap-x-6 gap-y-1 sm:gap-y-3 grid-cols-1 sm:grid-cols-[max-content_minmax(0,1fr)]">
            {WORDS.map(([word, meaning]) => (
              <div key={word} className="contents">
                <dt style={{ fontWeight: 600 }}>{word}</dt>
                <dd className="mb-3 sm:mb-0" style={{ color: T.textMuted, maxWidth: "58ch" }}>{meaning}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <PresenterNotes />

        <footer style={{ fontSize: SIZE.sm, color: T.textMuted, borderTop: `1px solid ${T.border}`, paddingTop: 20 }}>
          Attune early demo, build <span className="mono">{__BUILD_SHA__}</span>. Every person, practice and record shown is invented. Attune is not a medical device and doesn't diagnose or treat any condition.
        </footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><Guide /></StrictMode>);
