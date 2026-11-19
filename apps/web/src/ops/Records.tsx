/** Ops records: the fee ledger, the notification outbox, the provider directory and the append-only audit log. */
import { ROLE_LABEL, SECTION_STAFF, SPECIALTY, feesByPayer, nameOf, requirementLabel, type World } from "@attune/domain";
import { SIZE, T } from "../design/tokens";
import { money, when } from "../shared/format";
import { Empty, Notice, Panel, StatusPill, Tag, td, th } from "../shared/ui";

export function Ledger({ w }: { w: World }) {
  const owed = feesByPayer(w);
  const total = owed.reduce((s, o) => s + o.cents, 0);
  return (
    <Panel title="Fee ledger" meta={`${money(total)} accrued · $0.00 charged`}>
      <Notice tone="attention" title="Prototype: nothing is billed.">
        Fees accrue here to show the model. Only specialist practices ever owe; no field pays a PCP or a patient. A healthcare attorney must clear the
        specialist-paid fee before any real billing (OIG AO 26-15, Tex. Occ. Code 102.001).
      </Notice>
      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 560 }}>
          <thead><tr><th style={th}>Who</th><th style={th}>Terms</th><th style={th}>Referrals</th><th style={th}>Accrued</th><th style={th}>Charged</th></tr></thead>
          <tbody>
            {w.practices.filter((p) => p.kind === "specialist" && p.onAttune).map((p) => {
              const row = owed.find((o) => o.practiceId === p.id);
              const terms = w.feeTerms[p.id];
              return (
                <tr key={p.id}>
                  <td style={{ ...td, fontWeight: 600 }}>{p.name}</td>
                  <td style={td}>{terms ? `${money(terms.amountCents)} per referral, when ${terms.trigger === "booked" ? "booked" : "the visit is attended"}` : "None"}</td>
                  <td style={td} className="tnum">{row?.count ?? 0}</td>
                  <td style={td} className="tnum">{money(row?.cents ?? 0)}</td>
                  <td style={td} className="tnum">$0.00</td>
                </tr>
              );
            })}
            <tr><td style={{ ...td, fontWeight: 600 }}>PCP practices</td><td style={td}>Never charged</td><td style={td}>—</td><td style={td} className="tnum">$0.00</td><td style={td} className="tnum">$0.00</td></tr>
            <tr><td style={{ ...td, fontWeight: 600 }}>Patients</td><td style={td}>Never charged for the referral loop</td><td style={td}>—</td><td style={td} className="tnum">$0.00</td><td style={td} className="tnum">$0.00</td></tr>
          </tbody>
        </table>
      </div>
      {w.ledger.length > 0 && (
        <div style={{ overflowX: "auto", marginTop: 16 }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 560 }}>
            <thead><tr><th style={th}>Entry</th><th style={th}>Practice</th><th style={th}>Referral</th><th style={th}>Trigger</th><th style={th}>Accrued</th><th style={th}>Amount</th></tr></thead>
            <tbody>
              {[...w.ledger].reverse().map((l) => (
                <tr key={l.id}>
                  <td style={td} className="tnum">{l.id}</td><td style={td}>{nameOf(w, l.practiceId)}</td><td style={td} className="tnum">{l.referralId}</td>
                  <td style={td}>{l.trigger === "booked" ? "Booked" : "Visit attended"}</td><td style={td}>{when(l.accruedAt)}</td>
                  <td style={td} className="tnum">{money(l.amountCents)} <Tag>Not billed</Tag></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

export function Outbox({ w }: { w: World }) {
  const to = (n: World["notices"][number]) => (n.to.kind === "practice" ? nameOf(w, n.to.id) : `Patient ${w.patients.find((p) => p.id === n.to.id)?.ref ?? ""}`);
  return (
    <Panel title="Notifications" meta="Exact text sent. No health details, one SMS or less (enforced by tests).">
      {w.notices.length === 0 ? (
        <Empty>Nothing sent yet.</Empty>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 640 }}>
            <thead><tr><th style={th}>Sent</th><th style={th}>To</th><th style={th}>Channel</th><th style={th}>Text</th></tr></thead>
            <tbody>
              {[...w.notices].reverse().map((n) => (
                <tr key={n.id}>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>{when(n.at)}</td><td style={td}>{to(n)}</td>
                  <td style={td}>{n.channel === "push" ? "Push (in-app banner in the demo)" : "In-app"}</td><td style={td}>{n.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

export function Directory({ w }: { w: World }) {
  return (
    <Panel title="Provider directory" meta="Seeded practices. Off-Attune practices get the mocked fax or Direct fallback only.">
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 820 }}>
          <thead><tr><th style={th}>Practice</th><th style={th}>Type</th><th style={th}>On Attune</th><th style={th}>Route</th><th style={th}>Plans</th><th style={th}>Published criteria</th></tr></thead>
          <tbody>
            {w.practices.map((p) => (
              <tr key={p.id}>
                <td style={{ ...td, fontWeight: 600 }}>{p.name}<br /><span style={{ color: T.inkMuted, fontWeight: 400 }}>{p.place.label}</span></td>
                <td style={td}>{p.kind === "pcp" ? "PCP" : p.specialty ? SPECIALTY[p.specialty].label : "—"}</td>
                <td style={td}>{p.onAttune ? <StatusPill tone="done" label="On Attune" size="sm" /> : <StatusPill tone="neutral" label="Fallback only" size="sm" />}</td>
                <td style={td} className="tnum">
                  {p.routes.direct ?? (p.routes.fax ? `Fax ${p.routes.fax.number}` : "—")}
                  {p.routes.fax && !p.routes.direct && <span style={{ color: T.inkMuted }}> · {p.routes.fax.verified ? "verified" : "unverified"}</span>}
                </td>
                <td style={td}>{p.plans.length}</td>
                <td style={{ ...td, color: T.inkMuted }}>{p.kind === "pcp" ? "—" : p.criteria.length ? p.criteria.map(requirementLabel).join("; ") : "Signed referral only"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function AuditLog({ w }: { w: World }) {
  return (
    <Panel title="Audit log" meta={`${w.log.length} events · append-only`}>
      <div style={{ overflowX: "auto", maxHeight: 560, overflowY: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 760 }}>
          <thead><tr><th style={th}>#</th><th style={th}>Time</th><th style={th}>Actor</th><th style={th}>Event</th><th style={th}>Left her record</th></tr></thead>
          <tbody>
            {[...w.log].reverse().map((e) => (
              <tr key={e.seq}>
                <td style={{ ...td, color: T.inkMuted }} className="tnum">{e.seq}</td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>{when(e.at)}</td>
                <td style={td}><span style={{ fontWeight: 600 }}>{e.who}</span><br /><span style={{ color: T.inkMuted, fontSize: SIZE.xs }}>{ROLE_LABEL[e.by]}</span></td>
                <td style={td}>{e.summary}</td>
                <td style={{ ...td, color: T.inkMuted }}>{e.shared ? `${nameOf(w, e.shared.recipientId)}: ${e.shared.sections.map((s) => SECTION_STAFF[s].toLowerCase()).join(", ")}` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
