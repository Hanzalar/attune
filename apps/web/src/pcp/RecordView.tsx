import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { ALL_SECTIONS, DEMO_IDS, SECTION_STAFF, canSee, currentReferral, visibleSections, type SectionKey, type World } from "@attune/domain";
import { SIZE, T } from "../design/tokens";
import { ago, dateShort, when } from "../shared/format";
import { PatientPack } from "../shared/PatientPack";
import { act } from "../shared/store";
import { Empty, Notice, Panel, Tag } from "../shared/ui";
import { PageTitle } from "../shared/Clinic";
import { ReferralPanel } from "./ReferralPanel";
import type { Actor, Run } from "./types";

/** Her record on one page, limited to what she shares with this practice. Opening it logs a view she can see. */
export function RecordView({ w, now, patientId, actor, run, show, onSignAs }: {
  w: World; now: string; patientId: string; actor: Actor; run: Run; show: (m: string, e?: boolean) => void; onSignAs: () => void;
}) {
  const pcp = DEMO_IDS.pcp;
  const patient = w.patients.find((p) => p.id === patientId);
  const visible = visibleSections(w, patientId, pcp);
  const visibleKey = visible.join(",");

  const { by, who } = actor;
  useEffect(() => {
    if (!visibleKey) return;
    // Logged once per open; the domain also ignores repeat views by the same person within ten minutes.
    const err = act({ by, who, type: "viewRecord", patientId, recipientId: pcp, sections: visibleKey.split(",") as SectionKey[] });
    if (err) show(err, true);
  }, [patientId, visibleKey, by, who, pcp, show]);

  const back = (
    <a href="#/lookup" className="no-print inline-flex items-center gap-1" style={{ color: T.raspberry, fontWeight: 600, fontSize: SIZE.sm, marginTop: 16, minHeight: 32 }}>
      <ArrowLeft size={14} aria-hidden /> All patients
    </a>
  );

  if (!patient) return <>{back}<Notice tone="issue">No patient with that id.</Notice></>;
  if (visible.length === 0) {
    return (
      <>
        {back}
        <PageTitle over="Patient record" title={patient.name} />
        <Notice tone="attention" title="She isn't sharing her record with your practice">Ask her for a share code from her app, then open it under Patients.</Notice>
      </>
    );
  }

  const referral = currentReferral(w, patientId);
  const mine = referral && referral.pcpId === pcp ? referral : null;
  const since = w.consents.filter((c) => c.patientId === patientId && c.recipientId === pcp).map((c) => c.grantedAt).sort()[0];
  const views = w.views.filter((v) => v.patientId === patientId && v.recipientId === pcp).slice(-5).reverse();
  const summaries = w.summaries.filter((s) => w.referrals.some((r) => r.id === s.referralId && r.patientId === patientId && r.status === "closed"));

  return (
    <>
      {back}
      <PageTitle over={`Patient record · ${patient.ref}`} title={patient.name}>
        <div className="flex flex-wrap gap-1.5" aria-label="Sections she shares with you">
          {ALL_SECTIONS.map((s) => <Tag key={s} tone={canSee(w, patientId, pcp, s) ? "rose" : "neutral"}>{canSee(w, patientId, pcp, s) ? "" : "Not shared: "}{SECTION_STAFF[s]}</Tag>)}
        </div>
      </PageTitle>
      <p style={{ fontSize: SIZE.sm, color: T.inkMuted, margin: "-6px 0 16px" }}>
        DOB {dateShort(patient.dob)} · Sharing {visible.length} of 6 sections with you since {since ? dateShort(since) : "—"}. Sections she hasn't shared are marked, not hidden.
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex flex-col gap-4" style={{ minWidth: 0 }}>
          <Panel title="Her record" meta="Display only, from her app and your chart">
            <PatientPack w={w} patientId={patientId} viewerId={pcp} referral={mine} now={now} />
          </Panel>
          <Panel title={SECTION_STAFF.summaries} meta="Returned by specialists">
            {!canSee(w, patientId, pcp, "summaries") ? (
              <Empty>Not shared by the patient.</Empty>
            ) : summaries.length === 0 ? (
              <Empty>No visit summaries yet.</Empty>
            ) : (
              summaries.map((s) => (
                <div key={s.id} style={{ fontSize: SIZE.sm, padding: "6px 0" }}>
                  <strong>{w.practices.find((p) => p.id === s.practiceId)?.name}</strong> · {when(s.at)} · {s.author}
                  <p style={{ margin: "4px 0 0" }}>{s.text}</p>
                </div>
              ))
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-4" style={{ minWidth: 0 }}>
          <ReferralPanel w={w} now={now} patient={patient} referral={mine} actor={actor} run={run} onSignAs={onSignAs} />
          <Panel title="Views from your practice" meta="She sees this list">
            {views.length === 0 ? <Empty>No views yet.</Empty> : (
              <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: SIZE.sm }}>
                {views.map((v) => (
                  <li key={v.at + v.viewer} style={{ padding: "4px 0" }}>{v.viewer} · {ago(v.at, now)} · {v.sections.length} sections</li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
