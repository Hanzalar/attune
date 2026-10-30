import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, Inbox, ListChecks, ShieldCheck, Smartphone, Sparkles } from "lucide-react";
import { nextStep } from "@attune/domain";
import "../index.css";
import { StageList } from "../shared/loop";
import { resetDemo, useReferral, viewUrl, type View } from "../shared/store";
import { C, SERIF } from "../shared/theme";

const REPO = "https://github.com/Hanzalar/attune";

const VIEWS: { id: View; title: string; who: string; gets: string; Icon: typeof Smartphone }[] = [
  { id: "patient", title: "Patient app", who: "The patient, on her phone. Installable as a web app today; a native shell later wraps the same code.", gets: "No more chasing the referral, no retelling her history from memory, an earlier slot.", Icon: Smartphone },
  { id: "pcp", title: "PCP admin", who: "The PCP office's medical assistant and physician. Web, no install, works next to Tebra or any EMR.", gets: "A pre-filled packet to check and sign in minutes, verified fax and NPI, status after sending.", Icon: ListChecks },
  { id: "specialist", title: "Specialist admin", who: "The OB/GYN front desk and provider. Fax still lands in athena or Epic as usual.", gets: "Pre-qualified new patients, evidence with sources, cancellation fill, less intake work.", Icon: Inbox },
];

const RULES = [
  "The patient approves what's shared, which specialist, and the booking.",
  "Nothing is sent before the PCP's office signs off.",
  "Matches are never ranked by who pays Attune.",
  "Decision support, never a diagnosis.",
];

function Home() {
  const r = useReferral();
  const step = nextStep(r);
  return (
    <div style={{ background: C.mist, minHeight: "100vh", padding: "0 16px" }}>
      <main className="mx-auto py-10" style={{ maxWidth: 1080 }}>
        <div className="flex items-center gap-2">
          <div className="rounded-full flex items-center justify-center" style={{ width: 34, height: 34, background: C.coral }}><Sparkles size={18} color="white" /></div>
          <span style={{ fontFamily: SERIF, fontSize: 24, color: C.ink, fontWeight: 600 }}>Attune</span>
        </div>
        <h1 style={{ fontFamily: SERIF, fontSize: 34, lineHeight: 1.15, color: C.ink, marginTop: 20, maxWidth: 720 }}>
          A referral agent the patient owns, from her PCP to the OB/GYN and back.
        </h1>
        <p style={{ color: C.slate, fontSize: 15, marginTop: 12, maxWidth: 680, lineHeight: 1.5 }}>
          Three views over one shared record. Open each in its own tab, or on different screens of the same browser, and walk the loop: approve on the patient app, sign in PCP admin, accept in specialist admin. Every person and practice here is synthetic.
        </p>

        <div className="grid gap-4 mt-8 grid-cols-1 md:grid-cols-3">
          {VIEWS.map(({ id, title, who, gets, Icon }) => (
            <a key={id} href={viewUrl(id)} target={`attune-${id}`} className="rounded-3xl p-5 flex flex-col" style={{ background: C.white, border: `1px solid ${step.view === id ? C.coral : C.line}` }}>
              <div className="flex items-center justify-between">
                <Icon size={22} color={C.plum} />
                {step.view === id && <span className="rounded-full px-2.5 py-1" style={{ background: C.amberSoft, color: C.amberInk, fontSize: 11, fontWeight: 700 }}>Next: {step.label}</span>}
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginTop: 12 }}>{title}</h2>
              <p style={{ fontSize: 13, color: C.slate, marginTop: 6, lineHeight: 1.45 }}>{who}</p>
              <p style={{ fontSize: 13, color: C.ink, marginTop: 10, lineHeight: 1.45 }}><b>Gets:</b> {gets}</p>
              <span className="mt-auto pt-4 flex items-center gap-1" style={{ color: C.coral, fontWeight: 700, fontSize: 13.5 }}>Open {title} <ArrowRight size={15} /></span>
            </a>
          ))}
        </div>

        <div className="grid gap-4 mt-6 grid-cols-1 md:grid-cols-[1.2fr_1fr]">
          <section className="rounded-3xl p-5" style={{ background: C.white, border: `1px solid ${C.line}` }}>
            <div className="flex items-center justify-between">
              <h2 style={{ fontSize: 13, fontWeight: 700, color: C.plum, textTransform: "uppercase", letterSpacing: 1.2 }}>Live loop status</h2>
              <button onClick={resetDemo} style={{ fontSize: 12, color: C.slate, cursor: "pointer" }}>Reset demo</button>
            </div>
            <div className="mt-3"><StageList r={r} compact /></div>
          </section>
          <section className="rounded-3xl p-5" style={{ background: C.white, border: `1px solid ${C.line}` }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: C.plum, textTransform: "uppercase", letterSpacing: 1.2 }}>Rules the agent follows</h2>
            <ul className="mt-3 flex flex-col gap-2.5">
              {RULES.map((t) => (
                <li key={t} className="flex gap-2" style={{ fontSize: 13.5, color: C.ink }}><ShieldCheck size={16} color={C.green} style={{ flexShrink: 0, marginTop: 2 }} /> {t}</li>
              ))}
            </ul>
            <p style={{ fontSize: 12.5, color: C.slate, marginTop: 14, lineHeight: 1.5 }}>
              Product, discovery and competitor notes live on the <a href={`${REPO}/tree/business`} style={{ color: C.coral, fontWeight: 600 }}>business branch</a>. Specs, decisions and release evidence live on <a href={`${REPO}/tree/meta`} style={{ color: C.coral, fontWeight: 600 }}>meta</a>.
            </p>
          </section>
        </div>
        <p style={{ fontSize: 11.5, color: C.slate2, marginTop: 24 }}>Preview build {__BUILD_SHA__} from develop. Not a medical device; for demonstration only.</p>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><Home /></StrictMode>);
