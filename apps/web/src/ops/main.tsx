/** Attune ops: the mocked back office that makes the prototype run. Insurance checks, queues, directory, ledger, logs. */
import { useEffect, useState } from "react";
import { ClockControls } from "../shared/ClockControls";
import { DemoBar, mount } from "../shared/DemoBar";
import { Wordmark } from "../shared/Brand";
import { useNow, useWorld } from "../shared/store";
import { Panel, Voice, useAct, useToast } from "../shared/ui";
import { RADIUS, SIZE, T } from "../design/tokens";
import { InsuranceQueue, WaitlistAndOffers } from "./Queues";
import { AuditLog, Directory, Ledger, Outbox } from "./Records";

const TABS = [
  { id: "insurance", label: "Insurance" },
  { id: "waitlist", label: "Waitlist and offers" },
  { id: "ledger", label: "Fee ledger" },
  { id: "notices", label: "Notifications" },
  { id: "directory", label: "Directory" },
  { id: "audit", label: "Audit log" },
  { id: "clock", label: "Demo clock" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const tabFromHash = (): Tab => {
  const h = window.location.hash.replace("#", "");
  return (TABS.find((t) => t.id === h)?.id ?? "insurance") as Tab;
};

function App() {
  const w = useWorld();
  const now = useNow();
  const [toast, show] = useToast();
  const run = useAct(show);
  const [tab, setTab] = useState<Tab>(tabFromHash);
  useEffect(() => {
    const on = () => setTab(tabFromHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: T.bone }}>
      <DemoBar here="ops" />
      <header style={{ background: T.wine, padding: "12px 20px" }}>
        <Wordmark onDark size={24} sub="Operations (mocked)" />
      </header>
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "20px 16px 64px" }}>
        <Voice size={SIZE.xl}>Behind the curtain.</Voice>
        <p style={{ fontSize: SIZE.sm, color: T.inkMuted, margin: "6px 0 16px", maxWidth: 720 }}>
          What a small operations team would see. In the prototype, insurance checks and the directory are mocked; matching, offers, holds, statuses and the
          ledger run on the real rules.
        </p>
        <nav aria-label="Ops sections" className="flex flex-wrap gap-1" style={{ marginBottom: 16 }}>
          {TABS.map((t) => (
            <a key={t.id} href={`#${t.id}`} aria-current={tab === t.id ? "page" : undefined}
              style={{ padding: "8px 12px", borderRadius: RADIUS.sm, fontSize: SIZE.sm, fontWeight: 600, color: tab === t.id ? T.cream : T.forest, background: tab === t.id ? T.forest : "transparent", border: `1px solid ${tab === t.id ? T.forest : T.hairline}` }}>
              {t.label}
            </a>
          ))}
        </nav>
        {tab === "insurance" && <InsuranceQueue w={w} now={now} run={run} />}
        {tab === "waitlist" && <WaitlistAndOffers w={w} now={now} run={run} />}
        {tab === "ledger" && <Ledger w={w} />}
        {tab === "notices" && <Outbox w={w} />}
        {tab === "directory" && <Directory w={w} />}
        {tab === "audit" && <AuditLog w={w} />}
        {tab === "clock" && <Panel title="Demo clock"><ClockControls run={run} /></Panel>}
      </main>
      {toast}
    </div>
  );
}

mount(App);
