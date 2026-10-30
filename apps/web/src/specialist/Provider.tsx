import { Bar, BarChart, CartesianGrid, ComposedChart, Line, LineChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { AlertTriangle, CircleAlert, Download, ShieldCheck, Stethoscope, TrendingDown } from "lucide-react";
import { DEMO_EVIDENCE, DEMO_PATIENT, DEMO_SERIES, MFG_DEFAULT_THRESHOLD, type Referral } from "@attune/domain";
import { EVIDENCE } from "../shared/Dossier";
import { useAct } from "../shared/loop";
import { FONT, RADIUS, SERIES, SIZE, T } from "../design/tokens";
import { Button, Metric, Panel, StatusPill } from "../shared/ui";

const cycles = DEMO_EVIDENCE.cycleLengths.map((len, i) => ({ c: `Cycle ${i + 1}`, len }));
const tick = { fontSize: SIZE.xs, fill: T.textMuted, fontFamily: FONT.sans };
const muted = { fontSize: SIZE.xs + 1, color: T.textMuted } as const;
const refLabel = (value: string) => ({ value, fontSize: SIZE.xs, fill: T.danger, position: "insideTopRight" as const });

export function ProviderConsole({ r, show, openDossier }: { r: Referral; show: (m: string, e?: boolean) => void; openDossier: () => void }) {
  const run = useAct(show);
  const latestMfg = DEMO_EVIDENCE.mfgScores.at(-1);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 p-4" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: RADIUS.md }}>
        <div className="flex items-center justify-center" style={{ width: 44, height: 44, background: T.brandSoft, borderRadius: RADIUS.md, flexShrink: 0 }}>
          <span style={{ fontFamily: FONT.mono, color: T.brandInk, fontSize: SIZE.body, fontWeight: 500 }}>MK</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="flex flex-wrap items-center gap-2">
            <span style={{ color: T.text, fontSize: SIZE.md, fontWeight: 600 }}>Patient <span style={{ fontFamily: FONT.mono }}>{DEMO_PATIENT.ref}</span></span>
            <StatusPill tone="warning" icon={CircleAlert}>PMOS workup · under review</StatusPill>
          </div>
          <span style={muted}>{DEMO_PATIENT.age} y · {DEMO_PATIENT.phenotype.toLowerCase()} pattern · {DEMO_PATIENT.daysTracked} days of structured data</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <StatusPill tone="info" icon={ShieldCheck}>Decision support, not a diagnosis</StatusPill>
          <Button kind="primary" onClick={openDossier}><Download size={15} aria-hidden /> Dossier</Button>
        </div>
      </div>

      <div className="grid gap-3 mt-4 grid-cols-2 md:grid-cols-4">
        <Metric label="mFG hirsutism" value={String(latestMfg)} unit="/ 36" note={<><TrendingDown size={13} aria-hidden /> ≥{MFG_DEFAULT_THRESHOLD} = hirsutism · easing</>} tone="watch" />
        <Metric label="Cycle length" value={`${Math.min(...DEMO_EVIDENCE.cycleLengths)}–${Math.max(...DEMO_EVIDENCE.cycleLengths)}`} unit="d" note={<><AlertTriangle size={13} aria-hidden /> oligomenorrhea</>} tone="flag" />
        <Metric label="HOMA-IR" value={String(DEMO_EVIDENCE.labs.homaIr)} note={<><AlertTriangle size={13} aria-hidden /> elevated (&gt;2.5)</>} tone="flag" />
        <Metric label="Domains supported" value={`${EVIDENCE.domainsMet} / 3`} note={<>imaging not read by Attune</>} tone="watch" />
      </div>

      <div className="grid gap-4 mt-4 grid-cols-1 lg:grid-cols-[1.35fr_1fr]">
        <div className="flex flex-col gap-4" style={{ minWidth: 0 }}>
          <Panel title="Validated instruments, trend" right={<span style={muted}>modified Ferriman-Gallwey</span>}>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={DEMO_SERIES.mfg} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid stroke={T.border} vertical={false} />
                  <XAxis dataKey="m" tick={tick} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 16]} tick={tick} axisLine={false} tickLine={false} />
                  <ReferenceLine y={MFG_DEFAULT_THRESHOLD} stroke={T.danger} strokeDasharray="4 4" label={refLabel("2023 guideline threshold")} />
                  <Line type="monotone" dataKey="score" name="mFG score" stroke={SERIES[0]} strokeWidth={2.5} dot={{ r: 3, fill: SERIES[0] }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title="Menstrual cycle length" right={<span style={muted}>last {cycles.length} cycles · Attune tracker</span>}>
            <div style={{ height: 150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cycles} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid stroke={T.border} vertical={false} />
                  <XAxis dataKey="c" tick={tick} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 70]} tick={tick} axisLine={false} tickLine={false} />
                  <ReferenceLine y={35} stroke={T.danger} strokeDasharray="4 4" label={refLabel("35 d")} />
                  <Bar dataKey="len" name="Days" radius={[3, 3, 0, 0]} fill={SERIES[0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2" style={muted}>{EVIDENCE.criteria[0]!.detail}</p>
          </Panel>
        </div>
        <div className="flex flex-col gap-4" style={{ minWidth: 0 }}>
          <Panel title="Intervention response (N-of-1)" right={<StatusPill tone="success">Signal detected</StatusPill>}>
            <div style={{ height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={DEMO_SERIES.trial} margin={{ top: 14, right: 4, left: -26, bottom: 0 }}>
                  <CartesianGrid stroke={T.border} vertical={false} />
                  <XAxis dataKey="wk" tick={tick} axisLine={false} tickLine={false} interval={2} />
                  <YAxis domain={[0, 10]} tick={tick} axisLine={false} tickLine={false} />
                  <ReferenceLine x="W4" stroke={T.textMuted} strokeDasharray="3 3" label={{ value: "inositol", fontSize: SIZE.xs, fill: T.textMuted, position: "top" }} />
                  <Bar dataKey="adh" name="Adherence (scaled)" barSize={9} radius={[2, 2, 0, 0]} fill={SERIES[1]} />
                  <Line type="monotone" dataKey="acne" name="Acne (0-10)" stroke={SERIES[0]} strokeWidth={2.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-4 mt-2" style={muted}>
              <span className="flex items-center gap-1.5"><span style={{ width: 14, height: 3, background: SERIES[0], borderRadius: 2 }} aria-hidden /> Acne severity (0-10)</span>
              <span className="flex items-center gap-1.5"><span style={{ width: 10, height: 10, background: SERIES[1], borderRadius: 2 }} aria-hidden /> Adherence</span>
            </div>
          </Panel>
          <Panel title="Open gaps for this visit" right={<span style={muted}>Intl. PCOS/PMOS Guideline 2023</span>}>
            <ul className="flex flex-col gap-2">
              {EVIDENCE.gaps.map((g) => (
                <li key={g} className="flex items-start gap-2" style={{ fontSize: SIZE.sm, color: T.text }}>
                  <CircleAlert size={16} color={T.warning} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden /> {g}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Record the visit">
            <p style={muted}>When the visit is done, the outcome goes back to the referring PCP and the patient's plan.</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button kind="primary" disabled={r.stage !== "booked"}
                onClick={() => run({ type: "completeVisit", by: "specialist_provider", outcome: "Androgen and exclusion labs ordered; inositol continued; follow-up in 6 weeks." }, "Outcome sent back to the PCP")}>
                <Stethoscope size={16} aria-hidden /> {r.outcome ? "Outcome sent" : "Visit done, send outcome"}
              </Button>
              {r.stage !== "booked" && !r.outcome && <span style={muted}>Available once the visit is booked.</span>}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
