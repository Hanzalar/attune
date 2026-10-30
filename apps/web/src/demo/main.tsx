import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, BookOpen, Inbox, ListChecks, ShieldCheck, Smartphone } from "lucide-react";
import { nextStep } from "@attune/domain";
import "../index.css";
import { RADIUS, SIZE, T } from "../design/tokens";
import { Wordmark } from "../shared/Brand";
import { StageList } from "../shared/loop";
import { resetDemo, useReferral, viewUrl, type View } from "../shared/store";
import { Button, Label, Panel, StatusPill } from "../shared/ui";

const REPO = "https://github.com/Hanzalar/attune";

const VIEWS: { id: View; title: string; who: string; gets: string; Icon: typeof Smartphone }[] = [
  { id: "patient", title: "Patient app", who: "The patient, on a phone. Installable web app today.", gets: "Book a gynecologist and a time in three steps; no chasing the referral.", Icon: Smartphone },
  { id: "pcp", title: "PCP admin", who: "The PCP office's medical assistant and physician. Web, no install.", gets: "A pre-filled packet to check and sign once, with status after sending.", Icon: ListChecks },
  { id: "specialist", title: "Specialist admin", who: "The OB/GYN front desk and provider. Fax still lands in athena or Epic.", gets: "Pre-qualified referrals with a requested time to confirm in one click.", Icon: Inbox },
];

const RULES = [
  "The patient approves what's shared, which specialist, and the time.",
  "Nothing is sent before the PCP's office signs off.",
  "Matches are never ranked by who pays Attune.",
  "Decision support, never a diagnosis.",
];

function DemoHub() {
  const r = useReferral();
  const step = nextStep(r);
  return (
    <div style={{ background: T.canvas, minHeight: "100vh", paddingLeft: "max(16px, env(safe-area-inset-left))", paddingRight: "max(16px, env(safe-area-inset-right))" }}>
      <main className="mx-auto py-8 flex flex-col gap-6" style={{ maxWidth: 1080 }}>
        <Wordmark size={30} sub="Demo" />
        <div className="flex flex-col gap-2">
          <h1 style={{ fontSize: SIZE.xxl, fontWeight: 600, color: T.text, lineHeight: 1.2, maxWidth: 760 }}>Three views over one referral record</h1>
          <p style={{ color: T.textMuted, fontSize: SIZE.body, maxWidth: 700, lineHeight: 1.5 }}>
            Open each view in its own tab of the same browser and walk the loop: book on the patient app, sign in PCP admin, confirm in specialist admin. Every person and practice here is synthetic.
          </p>
          <a href={viewUrl("guide")} className="inline-flex items-center gap-1.5 self-start" style={{ color: T.brand, fontWeight: 600, fontSize: SIZE.sm + 1 }}>
            <BookOpen size={16} aria-hidden /> Showing this to a patient? Use the patient walkthrough
          </a>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          {VIEWS.map(({ id, title, who, gets, Icon }) => (
            <a key={id} href={viewUrl(id)} target={`attune-${id}`} className="flex flex-col gap-2 p-5"
              style={{ background: T.surface, border: `1px solid ${step.view === id ? T.brand : T.border}`, boxShadow: step.view === id ? `inset 0 0 0 1px ${T.brand}` : undefined, borderRadius: RADIUS.md }}>
              <div className="flex items-center justify-between gap-2">
                <Icon size={22} color={T.brand} aria-hidden />
                {step.view === id && <StatusPill tone="warning">Next: {step.label}</StatusPill>}
              </div>
              <h2 style={{ fontSize: SIZE.md, fontWeight: 600, color: T.text }}>{title}</h2>
              <p style={{ fontSize: SIZE.sm, color: T.textMuted, lineHeight: 1.45 }}>{who}</p>
              <p style={{ fontSize: SIZE.sm, color: T.text, lineHeight: 1.45 }}><b>Gets:</b> {gets}</p>
              <span className="mt-auto pt-2 flex items-center gap-1" style={{ color: T.brand, fontWeight: 600, fontSize: SIZE.sm }}>Open {title} <ArrowRight size={15} aria-hidden /></span>
            </a>
          ))}
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-[1.2fr_1fr]">
          <Panel title="Live loop status" right={<Button kind="quiet" onClick={resetDemo}>Reset demo</Button>}>
            <StageList r={r} compact />
          </Panel>
          <Panel title="Rules the agent follows">
            <ul className="flex flex-col gap-2.5">
              {RULES.map((t) => (
                <li key={t} className="flex gap-2" style={{ fontSize: SIZE.sm + 1, color: T.text }}><ShieldCheck size={17} color={T.success} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden /> {t}</li>
              ))}
            </ul>
            <div className="mt-4"><Label>Planning</Label></div>
            <p style={{ fontSize: SIZE.sm, color: T.textMuted, marginTop: 4, lineHeight: 1.5 }}>
              Product and discovery notes live on the <a href={`${REPO}/tree/business`} style={{ color: T.brand, fontWeight: 600 }}>business branch</a>; specs and release evidence on <a href={`${REPO}/tree/meta`} style={{ color: T.brand, fontWeight: 600 }}>meta</a>.
            </p>
          </Panel>
        </div>
        <p style={{ fontSize: SIZE.xs, color: T.textSubtle }}>Preview build <span className="mono">{__BUILD_SHA__}</span> from develop. Not a medical device; for demonstration only.</p>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><DemoHub /></StrictMode>);
