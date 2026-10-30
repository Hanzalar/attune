import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { CalendarCheck, LineChart, ListChecks, MessageSquareText, Stethoscope } from "lucide-react";
import { DEMO_PATIENT } from "@attune/domain";
import "../index.css";
import { RADIUS, SIZE, T } from "../design/tokens";
import { Wordmark } from "../shared/Brand";
import { Dossier } from "../shared/Dossier";
import { LoopBar } from "../shared/loop";
import { useReferral } from "../shared/store";
import { Toast, useToast } from "../shared/ui";
import { Coach } from "./Coach";
import { ReferralTab } from "./referral/ReferralTab";
import { Insights, Today, Trials } from "./Tracker";

type Tab = "today" | "insights" | "trials" | "coach" | "referral";
const TABS = [
  { id: "today", label: "Today", Icon: CalendarCheck },
  { id: "insights", label: "Insights", Icon: LineChart },
  { id: "trials", label: "Trials", Icon: ListChecks },
  { id: "coach", label: "Coach", Icon: MessageSquareText },
  { id: "referral", label: "Referral", Icon: Stethoscope },
] as const;

function PatientApp() {
  const r = useReferral();
  const [tab, setTab] = useState<Tab>("referral");
  const [dossier, setDossier] = useState(false);
  const [toast, show] = useToast();
  const openDossier = () => setDossier(true);
  return (
    <div style={{ background: T.canvas, minHeight: "100vh", paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }}>
      <div className="hidden sm:block"><LoopBar r={r} here="patient" /></div>
      {/* Full-bleed on phones; a phone-sized frame on desktop so the demo reads as a mobile app. */}
      <div className="mx-auto sm:pb-8" style={{ maxWidth: 402 }}>
        <div className="relative sm:border" style={{ background: T.canvas, borderColor: T.border, borderRadius: 0, minHeight: "100vh" }}>
          <header className="flex items-center justify-between px-4 pb-3" style={{ paddingTop: "max(14px, env(safe-area-inset-top))", background: T.surface, borderBottom: `1px solid ${T.border}` }}>
            <Wordmark size={26} />
            <span aria-label={`Signed in as ${DEMO_PATIENT.firstName}`} className="flex items-center justify-center"
              style={{ width: 32, height: 32, borderRadius: 16, background: T.brandSoft, color: T.brandInk, fontSize: SIZE.sm, fontWeight: 600 }}>
              {DEMO_PATIENT.firstName[0]}
            </span>
          </header>
          <main className="px-4 pt-4 pb-28">
            {tab === "today" && <Today openDossier={openDossier} />}
            {tab === "insights" && <Insights />}
            {tab === "trials" && <Trials />}
            {tab === "coach" && <Coach openDossier={openDossier} />}
            {tab === "referral" && <ReferralTab r={r} show={show} openDossier={openDossier} />}
            <div className="sm:hidden mt-8"><LoopBar r={r} here="patient" /></div>
          </main>
          <nav aria-label="Patient app" className="fixed sm:absolute left-0 right-0 bottom-0 mx-auto flex justify-around px-1 pt-1.5"
            style={{ maxWidth: 402, background: T.surface, borderTop: `1px solid ${T.border}`, paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
            {TABS.map(({ id, label, Icon }) => {
              const on = tab === id;
              return (
                <button key={id} type="button" aria-current={on ? "page" : undefined} onClick={() => setTab(id)}
                  className="flex flex-col items-center justify-center gap-0.5 flex-1"
                  style={{ minHeight: 48, color: on ? T.brand : T.textMuted, cursor: "pointer", borderRadius: RADIUS.md }}>
                  <span style={{ width: 28, height: 3, borderRadius: 2, background: on ? T.brand : "transparent", marginBottom: 3 }} />
                  <Icon size={21} aria-hidden /><span style={{ fontSize: SIZE.xs, fontWeight: on ? 600 : 500 }}>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      {dossier && <Dossier close={() => setDossier(false)} />}
      <Toast toast={toast} />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><PatientApp /></StrictMode>);
