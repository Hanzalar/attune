import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { requirementLabel, type Requirement } from "@attune/domain";
import { RADIUS, SIZE, T } from "../design/tokens";
import { money } from "../shared/format";
import { Button, Empty, Field, Notice, Panel, inputStyle, td, th } from "../shared/ui";
import { PageTitle } from "../shared/Clinic";
import type { DeskProps } from "./types";

const RESULT_NAMES = ["A1c", "TSH", "Total testosterone", "Prolactin", "Pelvic ultrasound"];
const MONTHS = [3, 6, 12, 24];
const CHECKIN_DAYS = [7, 14, 30];
const small = { ...inputStyle, minHeight: 36, padding: "6px 8px", fontSize: SIZE.sm, width: "auto" };

/** What the practice needs before a referral counts as complete. Its only lever on who gets its openings. */
export function Criteria({ practice, w, desk, run }: DeskProps) {
  const [draft, setDraft] = useState<Requirement[]>(practice.criteria);
  const [addName, setAddName] = useState(RESULT_NAMES[0] ?? "A1c");
  const [addMonths, setAddMonths] = useState(12);
  const dirty = JSON.stringify(draft) !== JSON.stringify(practice.criteria);
  const usedNames = draft.flatMap((r) => (r.kind === "result" ? [r.name] : []));
  const free = RESULT_NAMES.filter((n) => !usedNames.includes(n));
  const hasCheckins = draft.some((r) => r.kind === "checkins");
  const plans = w.plans.filter((p) => practice.plans.includes(p.id));
  const fee = w.feeTerms[practice.id];

  const update = (i: number, next: Requirement) => setDraft(draft.map((r, j) => (j === i ? next : r)));
  const remove = (i: number) => setDraft(draft.filter((_, j) => j !== i));
  const addResult = () => {
    const name = free.includes(addName) ? addName : free[0];
    if (name) setDraft([...draft, { kind: "result", name, withinMonths: addMonths }]);
  };

  return (
    <>
      <PageTitle over="Practice criteria" title="What you need before a visit" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Panel
          title="Published criteria"
          meta="A signed PCP referral with a reason is always required"
          actions={<Button size="sm" disabled={!dirty} onClick={() => run({ ...desk, type: "setCriteria", practiceId: practice.id, criteria: draft }, "Criteria published. New referrals are checked against them.")}>Publish</Button>}
        >
          <div className="flex flex-col gap-3">
            {draft.length === 0 ? <Empty>No extra criteria: any signed referral with a reason is complete for you.</Empty> : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {draft.map((r, i) => (
                  <li key={`${r.kind}-${i}`} className="flex flex-wrap items-center gap-2" style={{ padding: "8px 0", borderBottom: `1px solid ${T.hairline}`, fontSize: SIZE.sm }}>
                    <span style={{ flex: 1, minWidth: 180, fontWeight: 600 }}>{r.kind === "section" ? requirementLabel(r) : r.kind === "result" ? r.name : "Check-ins logged by the patient"}</span>
                    {r.kind === "result" && (
                      <label className="flex items-center gap-1.5">within
                        <select aria-label={`${r.name} within months`} value={r.withinMonths} onChange={(e) => update(i, { ...r, withinMonths: Number(e.target.value) })} style={small}>
                          {MONTHS.map((m) => <option key={m} value={m}>{m} months</option>)}
                        </select>
                      </label>
                    )}
                    {r.kind === "checkins" && (
                      <label className="flex items-center gap-1.5">at least
                        <select aria-label="Minimum days of check-ins" value={r.minDays} onChange={(e) => update(i, { ...r, minDays: Number(e.target.value) })} style={small}>
                          {CHECKIN_DAYS.map((d) => <option key={d} value={d}>{d} days</option>)}
                        </select>
                      </label>
                    )}
                    <Button size="sm" variant="quiet" icon={<Trash2 size={14} aria-hidden />} onClick={() => remove(i)} ariaLabel={`Remove ${requirementLabel(r)}`}>Remove</Button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap items-end gap-2" style={{ background: T.bone, borderRadius: RADIUS.sm, padding: 10 }}>
              <Field label="Add a result" htmlFor="add-result">
                <select id="add-result" value={free.includes(addName) ? addName : free[0] ?? ""} onChange={(e) => setAddName(e.target.value)} disabled={free.length === 0} style={small}>
                  {free.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
              <Field label="Within" htmlFor="add-months">
                <select id="add-months" value={addMonths} onChange={(e) => setAddMonths(Number(e.target.value))} style={small}>
                  {MONTHS.map((m) => <option key={m} value={m}>{m} months</option>)}
                </select>
              </Field>
              <Button size="sm" variant="secondary" icon={<Plus size={14} aria-hidden />} disabled={free.length === 0} onClick={addResult}>Add result</Button>
              {!hasCheckins && (
                <Button size="sm" variant="secondary" icon={<Plus size={14} aria-hidden />} onClick={() => setDraft([...draft, { kind: "checkins", minDays: 7 }])}>Add check-in minimum</Button>
              )}
            </div>
            <Notice>Attune checks every referral against these before offering her your openings. PCP offices see them live while they write the referral. They are paperwork rules, never a judgment about her health.</Notice>
            {dirty && <Notice tone="attention">Unpublished changes. Referrals are still checked against your published criteria.</Notice>}
          </div>
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel title="Plans you accept" meta="Read-only in the prototype">
            {plans.length === 0 ? <Empty>No plans on file.</Empty> : (
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead><tr><th style={th}>Carrier</th><th style={th}>Plan</th></tr></thead>
                <tbody>{plans.map((p) => <tr key={p.id}><td style={td}>{p.carrier}</td><td style={td}>{p.name} ({p.type})</td></tr>)}</tbody>
              </table>
            )}
          </Panel>
          <Panel title="Attune fee" meta="Read-only">
            {fee ? (
              <p style={{ fontSize: SIZE.sm, margin: "0 0 10px" }}>
                <strong className="tnum">{money(fee.amountCents)}</strong> per referral, accrued when the visit is {fee.trigger === "visit_attended" ? "attended" : "booked"}. PCP offices and patients pay nothing.
              </p>
            ) : (
              <p style={{ fontSize: SIZE.sm, margin: "0 0 10px" }}>No fee terms on file.</p>
            )}
            <Notice tone="attention">Not billed during the pilot. A healthcare attorney must clear the fee before any real billing.</Notice>
            <p style={{ fontSize: SIZE.xs, color: T.inkMuted, margin: "10px 0 0" }}>
              The fee never affects who is offered your openings. Her referral, insurance, your criteria and her preferences decide who qualifies; the PCP's urgency flag, time waiting and distance decide the order.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
