import { useState } from "react";
import { Flag } from "lucide-react";
import { DEMO_IDS, REFERRAL_STATUS, SPECIALTY, demoChart, type ReferralStatus, type World } from "@attune/domain";
import { SIZE, T } from "../design/tokens";
import { daysWaiting, when } from "../shared/format";
import { Chip, Empty, Panel, StatusPill, td, th } from "../shared/ui";
import { AttachButtons } from "./Attach";
import { PageTitle } from "../shared/Clinic";
import { attachable, missingResultNames, nextStep } from "./next";
import type { Actor, Run } from "./types";

const GROUPS: { id: string; label: string; statuses: ReferralStatus[] }[] = [
  { id: "all", label: "All", statuses: [] },
  { id: "you", label: "Needs your office", statuses: ["draft", "needs_info"] },
  { id: "waiting", label: "Waiting", statuses: ["sent", "qualified", "insurance_pending", "insurance_issue", "on_waitlist", "offered"] },
  { id: "booked", label: "Booked", statuses: ["booked", "seen", "summary_received"] },
  { id: "closed", label: "Closed", statuses: ["closed"] },
];

const BOOKED: ReferralStatus[] = ["booked", "seen", "summary_received", "closed"];

/** Every referral your practice sent, where it is and who moves it next. Specialists are never ranked here. */
export function Board({ w, now, actor, run }: { w: World; now: string; actor: Actor; run: Run }) {
  const [group, setGroup] = useState("all");
  const all = w.referrals.filter((r) => r.pcpId === DEMO_IDS.pcp).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const filter = GROUPS.find((g) => g.id === group);
  const rows = filter && filter.statuses.length ? all.filter((r) => filter.statuses.includes(r.status)) : all;

  return (
    <>
      <PageTitle over="Status board" title="Your referrals" />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter referrals" style={{ marginBottom: 12 }}>
        {GROUPS.map((g) => {
          const n = g.statuses.length ? all.filter((r) => g.statuses.includes(r.status)).length : all.length;
          return <Chip key={g.id} selected={group === g.id} onClick={() => setGroup(g.id)}>{g.label} ({n})</Chip>;
        })}
      </div>
      <Panel pad={false}>
        {rows.length === 0 ? (
          <div style={{ padding: 16 }}><Empty>Nothing here.</Empty></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 940 }}>
              <thead>
                <tr>
                  <th style={th}>Patient</th><th style={th}>Specialty</th><th style={th}>Status</th><th style={th}>Waiting</th>
                  <th style={th}>Next step</th><th style={th}>Visit</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const patient = w.patients.find((p) => p.id === r.patientId);
                  const meta = REFERRAL_STATUS[r.status];
                  const next = nextStep(r, patient);
                  const slot = BOOKED.includes(r.status) && r.slotId ? w.slots.find((s) => s.id === r.slotId) : undefined;
                  const practice = slot ? w.practices.find((p) => p.id === slot.practiceId) : undefined;
                  return (
                    <tr key={r.id}>
                      <td style={td}>
                        <a href={`#/patient/${r.patientId}`} style={{ color: T.forest, fontWeight: 600 }}>{patient?.name}</a>
                        <div className="tnum" style={{ color: T.inkMuted, fontSize: SIZE.xs }}>{patient?.ref}</div>
                      </td>
                      <td style={td}>
                        {SPECIALTY[r.specialty].label}
                        {r.urgent && <div className="inline-flex items-center gap-1" style={{ color: T.wine, fontSize: SIZE.xs, fontWeight: 600, marginLeft: 6 }}><Flag size={12} aria-hidden /> Urgent</div>}
                      </td>
                      <td style={td}><StatusPill size="sm" tone={r.route === "fax" ? "neutral" : meta.tone} label={r.route === "fax" ? "Fax fallback" : meta.label} /></td>
                      <td style={td} className="tnum">{daysWaiting(r.waitlistSince, now)}</td>
                      <td style={td}>
                        {next.step}
                        <div style={{ color: T.inkMuted, fontSize: SIZE.xs }}>{next.owner}</div>
                        {r.status === "needs_info" && patient && (
                          <div className="flex flex-col gap-1.5" style={{ marginTop: 6 }}>
                            <span style={{ fontSize: SIZE.xs, color: T.sandInk }}>Missing: {r.missing.join("; ")}</span>
                            <AttachButtons results={attachable(patient, missingResultNames(r, demoChart(patient.id, now)), now)} referral={r} patient={patient} actor={actor} run={run} />
                          </div>
                        )}
                      </td>
                      <td style={td}>{slot && practice ? <>{when(slot.startsAt, practice.timeZone)}<div style={{ color: T.inkMuted, fontSize: SIZE.xs }}>{practice.name}</div></> : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
