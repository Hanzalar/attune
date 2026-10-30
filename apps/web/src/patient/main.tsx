import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { CalendarHeart, ChevronRight, FileText, FlaskConical, MessageCircle, Send, Sparkles } from "lucide-react";
import { DEMO_PATIENT } from "@attune/domain";
import "../index.css";
import { Dossier } from "../shared/Dossier";
import { LoopBar } from "../shared/loop";
import { useReferral } from "../shared/store";
import { C, SERIF } from "../shared/theme";
import { Toast, useToast } from "../shared/ui";
import { ReferralTab } from "./Referral";
import { Insights, Today, Trials } from "./Tracker";

type Tab = "today" | "insights" | "trials" | "coach" | "referral";
const TABS = [
  { id: "today", label: "Today", Icon: CalendarHeart },
  { id: "insights", label: "Insights", Icon: Sparkles },
  { id: "trials", label: "Trials", Icon: FlaskConical },
  { id: "coach", label: "Coach", Icon: MessageCircle },
  { id: "referral", label: "Referral", Icon: Send },
] as const;

const ANSWERS: Record<string, string> = {
  "Is my inositol working?": "Early read: yes. Since week 4, your acne severity fell from 7 to 3 while adherence stayed above 90%. Energy also nudged from 4 to 8. I'll confirm at week 8, after two more weeks of data.",
  "What changed this quarter?": "Three things moved: acne down 4 points, cycle length shortened from 58 to 41 days, and morning energy improved. Your hirsutism score (mFG) also eased from 12 to 9.",
  "What should I ask my doctor?": "Worth raising: testosterone and SHBG to complete the workup, a fasting insulin / HOMA-IR recheck, whether to continue inositol or add metformin, and the metabolic labs you haven't checked in 12 months.",
};

function Coach({ openDossier }: { openDossier: () => void }) {
  const [asked, setAsked] = useState<string | null>(null);
  const bubble = (text: string) => (
    <div className="flex gap-2.5">
      <div className="rounded-full flex items-center justify-center" style={{ width: 30, height: 30, background: C.coral, flexShrink: 0 }}><Sparkles size={15} color="white" /></div>
      <div className="rounded-2xl rounded-tl-sm p-3" style={{ background: C.mist }}><p style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.5 }}>{text}</p></div>
    </div>
  );
  return (
    <div>
      <p style={{ fontFamily: SERIF, fontSize: 24, color: C.ink, marginTop: 6 }}>Your coach</p>
      <p style={{ color: C.slate, fontSize: 13.5, marginTop: 4 }}>Grounded in your data, not a generic PMOS chatbot. Scripted answers in this demo.</p>
      <div className="rounded-3xl p-4 mt-4 flex flex-col gap-3" style={{ background: C.white, border: `1px solid ${C.line}`, minHeight: 260 }} aria-live="polite">
        {bubble(`Hi ${DEMO_PATIENT.firstName}, I've been watching your last 12 weeks. Tap a question below.`)}
        {asked && (
          <>
            <div className="flex justify-end"><div className="rounded-2xl rounded-tr-sm px-3.5 py-2.5" style={{ background: C.coral }}><p style={{ fontSize: 13.5, color: "white" }}>{asked}</p></div></div>
            {bubble(ANSWERS[asked] ?? "")}
          </>
        )}
      </div>
      <div className="flex flex-col gap-2 mt-3">
        {Object.keys(ANSWERS).map((p) => (
          <button key={p} onClick={() => setAsked(p)} className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: C.white, border: `1px solid ${C.line}`, cursor: "pointer" }}>
            <span style={{ fontSize: 13.5, color: C.ink }}>{p}</span><ChevronRight size={16} color={C.slate2} />
          </button>
        ))}
      </div>
      <button onClick={openDossier} className="w-full rounded-2xl py-3.5 mt-4 flex items-center justify-center gap-2" style={{ background: C.ink, color: "white", cursor: "pointer", fontWeight: 700, fontSize: 14.5 }}>
        <FileText size={17} /> Create dossier for my doctor
      </button>
    </div>
  );
}

function PatientApp() {
  const r = useReferral();
  const [tab, setTab] = useState<Tab>("referral");
  const [dossier, setDossier] = useState(false);
  const [toast, show] = useToast();
  const openDossier = () => setDossier(true);
  return (
    <div style={{ background: C.mist, minHeight: "100vh", paddingLeft: "max(0px, env(safe-area-inset-left))", paddingRight: "max(0px, env(safe-area-inset-right))" }}>
      <div className="hidden sm:block"><LoopBar r={r} here="patient" /></div>
      {/* Full-bleed on phones; a phone-sized frame on desktop so the demo reads as a mobile app. */}
      <div className="mx-auto sm:pb-8" style={{ maxWidth: 402 }}>
        <div className="relative overflow-hidden sm:rounded-[34px] sm:border" style={{ background: C.patientBg, borderColor: C.line, minHeight: "100vh", boxShadow: "0 24px 60px -30px rgba(42,26,56,.4)" }}>
          <header className="flex items-center justify-between px-5 pb-3" style={{ paddingTop: "max(20px, env(safe-area-inset-top))" }}>
            <div className="flex items-center gap-2">
              <div className="rounded-full flex items-center justify-center" style={{ width: 30, height: 30, background: C.coral }}><Sparkles size={16} color="white" /></div>
              <span style={{ fontFamily: SERIF, fontSize: 20, color: C.ink, fontWeight: 600 }}>Attune</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1" style={{ background: C.lavender }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: C.plum }} />
              <span style={{ fontSize: 11, color: C.plum, fontWeight: 600 }}>{DEMO_PATIENT.phenotype}</span>
            </div>
          </header>
          <main className="px-5 pb-28">
            {tab === "today" && <Today openDossier={openDossier} />}
            {tab === "insights" && <Insights />}
            {tab === "trials" && <Trials />}
            {tab === "coach" && <Coach openDossier={openDossier} />}
            {tab === "referral" && <ReferralTab r={r} show={show} openDossier={openDossier} />}
            <div className="sm:hidden mt-6"><LoopBar r={r} here="patient" /></div>
          </main>
          <nav aria-label="Patient app" className="fixed sm:absolute left-0 right-0 bottom-0 mx-auto flex justify-around px-1 pt-2.5"
            style={{ maxWidth: 402, background: "rgba(251,247,250,.94)", borderTop: `1px solid ${C.line}`, backdropFilter: "blur(8px)", paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}>
            {TABS.map(({ id, label, Icon }) => {
              const on = tab === id;
              return (
                <button key={id} aria-current={on ? "page" : undefined} onClick={() => setTab(id)} className="flex flex-col items-center gap-1 rounded-2xl px-2.5 py-1.5"
                  style={{ background: on ? C.white : "transparent", color: on ? C.coral : C.slate2, cursor: "pointer" }}>
                  <Icon size={20} /><span style={{ fontSize: 10.5, fontWeight: on ? 700 : 500 }}>{label}</span>
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
