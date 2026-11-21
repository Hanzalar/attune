import { CornerDownLeft } from "lucide-react";
import { DEMO_IDS, SPECIALTY, canSee, type World } from "@attune/domain";
import { SIZE, T } from "../design/tokens";
import { ago, when } from "../shared/format";
import { Empty, Panel, Rows, Tag } from "../shared/ui";
import { PageTitle } from "../shared/Clinic";

/** Visit summaries specialists returned for your patients, newest first, plus recent updates for your practice. */
export function Inbox({ w, now }: { w: World; now: string }) {
  const pcp = DEMO_IDS.pcp;
  const items = w.summaries
    .map((s) => ({ s, r: w.referrals.find((r) => r.id === s.referralId) }))
    .filter(({ r }) => r && r.pcpId === pcp && r.status === "closed" && canSee(w, r.patientId, pcp, "summaries"))
    .sort((a, b) => b.s.at.localeCompare(a.s.at));
  const notices = w.notices.filter((n) => n.to.kind === "practice" && n.to.id === pcp).slice(-8).reverse();

  return (
    <>
      <PageTitle over="Inbox" title="Visit summaries" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-4" style={{ minWidth: 0 }}>
          {items.length === 0 ? (
            <Panel><Empty>No summaries yet. They arrive here when a specialist closes a referral and the patient shares summaries with you.</Empty></Panel>
          ) : (
            items.map(({ s, r }) => {
              const patient = w.patients.find((p) => p.id === r?.patientId);
              const practice = w.practices.find((p) => p.id === s.practiceId);
              return (
                <Panel
                  key={s.id}
                  title={<a href={`#/patient/${patient?.id ?? ""}`} style={{ color: T.forest }}>{patient?.name}</a>}
                  meta={`${patient?.ref ?? ""} · ${r ? SPECIALTY[r.specialty].label : ""}`}
                  actions={s.backToPcp ? <Tag tone="rose"><CornerDownLeft size={11} aria-hidden style={{ display: "inline", marginRight: 4 }} />Back to you for ongoing care</Tag> : undefined}
                >
                  <Rows rows={[["From", `${s.author}, ${practice?.name ?? ""}`], ["Received", `${when(s.at, practice?.timeZone)} (${ago(s.at, now)})`]]} />
                  <p style={{ fontSize: SIZE.body, lineHeight: 1.5, margin: "12px 0 0" }}>{s.text}</p>
                  {s.followUp && <p style={{ fontSize: SIZE.sm, margin: "8px 0 0" }}><strong>Follow-up:</strong> {s.followUp}</p>}
                </Panel>
              );
            })
          )}
        </div>
        <Panel title="Recent updates" meta="For your practice">
          {notices.length === 0 ? <Empty>No updates yet.</Empty> : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, fontSize: SIZE.sm }}>
              {notices.map((n) => (
                <li key={n.id} style={{ padding: "6px 0", borderBottom: `1px solid ${T.hairline}` }}>
                  {n.text}
                  <div style={{ color: T.inkMuted, fontSize: SIZE.xs }}>{ago(n.at, now)}</div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
