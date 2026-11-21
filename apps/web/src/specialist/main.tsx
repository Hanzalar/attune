/**
 * Specialist portal, built for the front desk: publish criteria, post cancellations, follow filled slots, open the
 * Patient Pack once she has shared it, and return the visit summary.
 */
import { useState } from "react";
import { DEMO_IDS } from "@attune/domain";
import { DemoBar, mount } from "../shared/DemoBar";
import { useNow, useWorld } from "../shared/store";
import { Notice, useAct, useToast } from "../shared/ui";
import { DemoSelect, Page, PracticeNotices, TopBar, useHashRoute } from "../shared/Clinic";
import { Criteria } from "./Criteria";
import { Openings } from "./Openings";
import { Pack } from "./Pack";
import { SlotDetail } from "./SlotDetail";
import type { DeskProps } from "./types";

const NAV = [
  { path: "openings", label: "Openings" },
  { path: "criteria", label: "Criteria" },
];

function App() {
  const w = useWorld();
  const now = useNow(1000);
  const [section, id] = useHashRoute();
  const [practiceId, setPracticeId] = useState<string>(DEMO_IDS.endo);
  const [toast, show] = useToast();
  const run = useAct(show);
  const practices = w.practices.filter((p) => p.kind === "specialist" && p.onAttune);
  const practice = practices.find((p) => p.id === practiceId);
  const here = section === "criteria" ? "criteria" : "openings";

  const body = (() => {
    if (!practice) return <Notice tone="issue">That practice isn't on Attune.</Notice>;
    const deskName = practice.staff.find((s) => s.role === "specialist_staff")?.name ?? "Front desk (example)";
    const props: DeskProps = { w, now, practice, desk: { by: "specialist_staff", who: deskName }, run };
    if (section === "criteria") return <Criteria key={practice.id} {...props} />;
    if (section === "pack" && id) return <Pack {...props} referralId={id} show={show} />;
    if (section === "slot" && id) return <SlotDetail {...props} slotId={id} />;
    return <Openings {...props} />;
  })();

  return (
    <div style={{ minHeight: "100vh" }}>
      <DemoBar here="specialist" />
      <TopBar
        sub={`Specialist portal · ${practice?.name ?? ""}`}
        nav={NAV}
        here={here}
        right={
          <DemoSelect
            label="Practice (demo)"
            value={practiceId}
            onChange={(v) => {
              setPracticeId(v);
              show(`Viewing as ${practices.find((p) => p.id === v)?.name ?? v} (demo)`);
            }}
            options={practices.map((p) => ({ value: p.id, label: p.name }))}
          />
        }
      />
      <Page>
        {practice && <PracticeNotices key={`notices-${practice.id}`} w={w} practiceId={practice.id} now={now} />}
        {body}
      </Page>
      {toast}
    </div>
  );
}

mount(App);
