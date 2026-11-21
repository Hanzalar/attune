/**
 * PCP portal, built for the medical assistant: find a patient by share code, read her record on one page, build and
 * sign a referral, track it on the status board and receive visit summaries in the inbox.
 */
import { useState } from "react";
import { DEMO_IDS, DEMO_PEOPLE } from "@attune/domain";
import { DemoBar, mount } from "../shared/DemoBar";
import { useNow, useWorld } from "../shared/store";
import { useAct, useToast } from "../shared/ui";
import { Board } from "./Board";
import { DemoSelect, Page, PracticeNotices, TopBar, useHashRoute } from "../shared/Clinic";
import { Inbox } from "./Inbox";
import { Lookup } from "./Lookup";
import { RecordView } from "./RecordView";
import type { Actor, PcpRole } from "./types";

const PEOPLE: Record<PcpRole, string> = { pcp_ma: DEMO_PEOPLE.ma, pcp_physician: DEMO_PEOPLE.physician };
const NAV = [
  { path: "lookup", label: "Patients" },
  { path: "board", label: "Status board" },
  { path: "inbox", label: "Inbox" },
];

function App() {
  const w = useWorld();
  const now = useNow(5000);
  const route = useHashRoute();
  const [role, setRole] = useState<PcpRole>("pcp_ma");
  const [toast, show] = useToast();
  const run = useAct(show);
  const actor: Actor = { by: role, who: PEOPLE[role] };
  const pcp = w.practices.find((p) => p.id === DEMO_IDS.pcp);
  const [section, id] = route;
  const here = section === "patient" ? "lookup" : section ?? "lookup";

  const switchTo = (next: PcpRole) => {
    setRole(next);
    show(`Signed in as ${PEOPLE[next]} (demo)`);
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <DemoBar here="pcp" />
      <TopBar
        sub={`PCP portal · ${pcp?.name ?? ""}`}
        nav={NAV}
        here={here}
        right={
          <DemoSelect<PcpRole>
            label="Signed in as (demo)"
            value={role}
            onChange={switchTo}
            options={[
              { value: "pcp_ma", label: `${DEMO_PEOPLE.ma}, MA` },
              { value: "pcp_physician", label: `${DEMO_PEOPLE.physician}, physician` },
            ]}
          />
        }
      />
      <Page>
        <PracticeNotices w={w} practiceId={DEMO_IDS.pcp} now={now} />
        {section === "patient" && id ? (
          <RecordView w={w} now={now} patientId={id} actor={actor} run={run} show={show} onSignAs={() => switchTo("pcp_physician")} />
        ) : section === "board" ? (
          <Board w={w} now={now} actor={actor} run={run} />
        ) : section === "inbox" ? (
          <Inbox w={w} now={now} />
        ) : (
          <Lookup w={w} now={now} actor={actor} run={run} prefill={section === "lookup" ? id ?? "" : ""} />
        )}
      </Page>
      {toast}
    </div>
  );
}

mount(App);
