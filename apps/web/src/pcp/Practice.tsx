import { useState } from "react";
import { Pause, ShieldCheck } from "lucide-react";
import { DEMO_PCP, DEMO_SPECIALISTS, referralRequirement, type PlanType } from "@attune/domain";
import { FONT, RADIUS, SIZE, T } from "../design/tokens";
import { Chip, Label, Panel, StatusPill } from "../shared/ui";

const body = { fontSize: SIZE.sm, color: T.text } as const;
const muted = { fontSize: SIZE.xs + 1, color: T.textMuted } as const;

export function TrustedSpecialists() {
  const [paused, setPaused] = useState<Record<string, boolean>>({ ortiz: true });
  return (
    <Panel title="Trusted specialists" right={<span style={muted}>practice-level list, replaces the filing cabinet</span>}>
      <ul className="flex flex-col">
        {DEMO_SPECIALISTS.map((s, i) => (
          <li key={s.id} className="flex flex-wrap items-center gap-3 py-3" style={{ borderTop: i ? `1px solid ${T.border}` : "none" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ ...body, fontWeight: 600 }}>{s.name}</div>
              <div style={muted}>{s.specialty} · {s.practice} · {s.fitNote} · {s.ehr}</div>
            </div>
            {s.routes.fax && !s.routes.fax.verified && <StatusPill tone="danger">Fax unverified</StatusPill>}
            <button type="button" onClick={() => setPaused({ ...paused, [s.id]: !paused[s.id] })} aria-pressed={!paused[s.id]}
              aria-label={`${paused[s.id] ? "Resume" : "Pause"} referrals to ${s.name}`} style={{ cursor: "pointer" }}>
              {paused[s.id] ? <StatusPill tone="warning" icon={Pause}>Paused</StatusPill> : <StatusPill tone="success">Referring</StatusPill>}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3" style={muted}>Pausing hides a specialist from your patients' matches. It never reorders the others, and payment to Attune never affects order.</p>
    </Panel>
  );
}

const PLANS: PlanType[] = ["HMO", "POS", "EPO", "PPO"];

export function Settings() {
  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
      <Panel title="Practice" right={<Chip>read-only in the demo</Chip>}>
        <dl className="grid grid-cols-[minmax(0,120px)_minmax(0,1fr)] gap-x-3 gap-y-2" style={body}>
          <dt style={{ color: T.textMuted }}>Practice</dt><dd>{DEMO_PCP.practice}</dd>
          <dt style={{ color: T.textMuted }}>EMR</dt><dd>{DEMO_PCP.ehr} · export the packet as PDF into the chart</dd>
          <dt style={{ color: T.textMuted }}>Fax</dt><dd style={{ fontFamily: FONT.mono }} className="tnum">{DEMO_PCP.fax}</dd>
          <dt style={{ color: T.textMuted }}>Direct address</dt><dd>{DEMO_PCP.direct ?? "None yet. Your EMR vendor can issue one."}</dd>
        </dl>
        <Label mt={16}>Who can sign</Label>
        <ul className="flex flex-col gap-1.5 mt-2">
          {DEMO_PCP.staff.map((s) => (
            <li key={s.name} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2" style={{ ...body, background: T.sunken, borderRadius: RADIUS.md }}>
              <span style={{ fontWeight: 600 }}>{s.name}</span>
              <span style={muted}>{s.title} · {s.role === "pcp_physician" ? "signs any referral" : "signs where the plan allows"}</span>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Plan rules the agent drafts with" right={<StatusPill tone="warning" icon={ShieldCheck}>Defaults · verify per member</StatusPill>}>
        <div style={{ overflowX: "auto" }}>
          <table className="w-full" style={{ ...body, borderCollapse: "collapse", minWidth: 380 }}>
            <thead>
              <tr>{["Plan", "Referral", "Signer", "Out of network"].map((h) => (
                <th key={h} className="py-2 pr-3 text-left uppercase" style={{ fontSize: SIZE.xs, color: T.textMuted, fontWeight: 600, letterSpacing: "0.04em" }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {PLANS.map((p) => {
                const q = referralRequirement(p);
                return (
                  <tr key={p} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td className="py-2 pr-3" style={{ fontFamily: FONT.mono, fontWeight: 500 }}>{p}</td>
                    <td className="py-2 pr-3">{q.referralRequired ? "Required" : "Not required"}</td>
                    <td className="py-2 pr-3">{q.physicianSignature ? "Physician" : "MA"}</td>
                    <td className="py-2">{q.outOfNetworkExcluded ? "Not covered" : "Covered at a higher cost"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
