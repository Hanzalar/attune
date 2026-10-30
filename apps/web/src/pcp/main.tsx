import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Bot, ListChecks } from "lucide-react";
import { DEMO_MANUAL_QUEUE, DEMO_PATIENT, DEMO_PCP } from "@attune/domain";
import "../index.css";
import { ActivityLog, LoopBar } from "../shared/loop";
import { useReferral } from "../shared/store";
import { FONT, RADIUS, SIZE, T } from "../design/tokens";
import { Chip, ClinHeader, Panel, StatusPill, Tabs, Toast, useToast } from "../shared/ui";
import { ReferralDetail, queueStatus } from "./Detail";
import { Settings, TrustedSpecialists } from "./Practice";

type Tab = "queue" | "specialists" | "settings" | "activity";

const id = { fontFamily: FONT.mono, fontSize: SIZE.sm, fontWeight: 500, color: T.text } as const;

function PcpApp() {
  const r = useReferral();
  const [toast, show] = useToast();
  const [tab, setTab] = useState<Tab>("queue");
  const [tone, status] = queueStatus(r);
  const open = DEMO_MANUAL_QUEUE.length + 1;
  return (
    <div style={{ background: T.canvas, minHeight: "100vh", paddingLeft: "max(16px, env(safe-area-inset-left))", paddingRight: "max(16px, env(safe-area-inset-right))" }}>
      <LoopBar r={r} here="pcp" />
      <div className="mx-auto pb-10" style={{ maxWidth: 1180 }}>
        <ClinHeader icon={ListChecks} title="Referral queue" sub={`${DEMO_PCP.practice} · medical assistant and physician`}
          right={<><Chip tone="blue"><Bot size={12} aria-hidden /> 1 drafted by Attune</Chip><Chip>{DEMO_MANUAL_QUEUE.length} manual</Chip></>} />
        <div className="mt-2">
          <Tabs value={tab} onChange={setTab} tabs={[
            { id: "queue", label: "Queue", count: open }, { id: "specialists", label: "Trusted specialists" },
            { id: "settings", label: "Practice settings" }, { id: "activity", label: "Activity log", count: r.log.length },
          ]} />
        </div>
        <div className="mt-4">
          {tab === "queue" && (
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] items-start">
              <Panel title="Today's referrals" right={<span className="tnum" style={{ fontSize: SIZE.xs + 1, color: T.textMuted }}>{open} open</span>}>
                <ul className="flex flex-col gap-2">
                  <li className="p-3" aria-current="true" style={{ border: `1px solid ${T.brand}`, boxShadow: `inset 0 0 0 1px ${T.brand}`, borderRadius: RADIUS.md }}>
                    <div className="flex items-center justify-between gap-2">
                      <span style={id}>{DEMO_PATIENT.ref}</span>
                      <Chip tone="blue"><Bot size={12} aria-hidden /> Attune</Chip>
                    </div>
                    <div className="mt-1" style={{ fontSize: SIZE.sm, color: T.text }}>OB/GYN: oligomenorrhea, hirsutism, PMOS workup</div>
                    <div className="mt-2"><StatusPill tone={tone}>{status}</StatusPill></div>
                  </li>
                  {DEMO_MANUAL_QUEUE.map((q) => (
                    <li key={q.id}>
                      <button type="button" onClick={() => show("Manual referral: built by hand today")} className="w-full text-left p-3"
                        style={{ border: `1px solid ${T.border}`, borderRadius: RADIUS.md, background: T.surface, cursor: "pointer" }}>
                        <div className="flex items-center justify-between gap-2"><span style={id}>{q.id}</span><Chip>Manual</Chip></div>
                        <div className="mt-1" style={{ fontSize: SIZE.sm, color: T.text }}>{q.to}: {q.reason}</div>
                        <div className="mt-2"><StatusPill tone="neutral">{q.status}</StatusPill></div>
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>
              <ReferralDetail r={r} show={show} />
            </div>
          )}
          {tab === "specialists" && <TrustedSpecialists />}
          {tab === "settings" && <Settings />}
          {tab === "activity" && <Panel title="Activity log" right={<Chip>append-only</Chip>}><ActivityLog r={r} /></Panel>}
        </div>
      </div>
      <Toast toast={toast} />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><PcpApp /></StrictMode>);
