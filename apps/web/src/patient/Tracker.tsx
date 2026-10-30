import { useState, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Camera, Check, Cookie, FileText, Flame, Moon, Pill, SmilePlus, Zap } from "lucide-react";
import { DEMO_PATIENT, DEMO_SERIES } from "@attune/domain";
import { FONT, RADIUS, SERIES, SIZE, T } from "../design/tokens";
import { Button, Card, Label, Notice, StatusPill } from "../shared/ui";

const SYMPTOM_ICONS = { Acne: Flame, Cravings: Cookie, Energy: Zap, Sleep: Moon, Mood: SmilePlus };
type Symptom = keyof typeof SYMPTOM_ICONS;
const axis = { fontSize: 11, fill: T.textMuted, fontFamily: FONT.sans };

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <h1 style={{ fontSize: SIZE.xl, fontWeight: 600, color: T.text, lineHeight: 1.25 }}>{title}</h1>
      {sub && <p style={{ color: T.textMuted, fontSize: SIZE.body - 1, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

function Scale({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label={`${label}, 1 to 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${label} ${n} of 5`} onClick={() => onChange(n)}
          className="tnum flex items-center justify-center"
          style={{ width: 36, height: 36, borderRadius: RADIUS.sm, cursor: "pointer", fontSize: SIZE.sm, fontWeight: 600,
            border: `1px solid ${value === n ? T.brand : T.borderStrong}`, background: value === n ? T.brand : T.surface, color: value === n ? T.textOnBrand : T.text }}>
          {n}
        </button>
      ))}
    </div>
  );
}

export function Today({ openDossier }: { openDossier: () => void }) {
  const [sym, setSym] = useState<Record<Symptom, number>>({ Acne: 3, Cravings: 4, Energy: 2, Sleep: 3, Mood: 3 });
  const [meds, setMeds] = useState<Record<string, boolean>>({ Inositol: true, Metformin: false, "Vitamin D": true });
  const [logged, setLogged] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <PageTitle title={`Good morning, ${DEMO_PATIENT.firstName}`} sub="Cycle day 34 · 20-second check-in" />
      <Card>
        <div className="flex items-center justify-between"><Label>How are you today?</Label><span style={{ fontSize: SIZE.xs, color: T.textMuted }}>1 = low · 5 = high</span></div>
        <div className="mt-3 flex flex-col gap-3">
          {(Object.keys(sym) as Symptom[]).map((k) => {
            const Icon = SYMPTOM_ICONS[k];
            return (
              <div key={k} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2" style={{ fontSize: SIZE.body, color: T.text }}><Icon size={18} color={T.brand} aria-hidden />{k}</span>
                <Scale label={k} value={sym[k]} onChange={(v) => { setSym({ ...sym, [k]: v }); setLogged(false); }} />
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 flex items-center gap-2" style={{ borderTop: `1px solid ${T.border}`, color: T.textMuted, fontSize: SIZE.sm }}>
          <Camera size={18} aria-hidden /> Skin and hair photos for the mFG score aren't in the demo yet.
        </div>
      </Card>
      <Card>
        <Label>Today's plan</Label>
        <div className="mt-3 flex flex-col gap-2">
          {Object.keys(meds).map((m) => (
            <label key={m} htmlFor={`med-${m}`} className="flex items-center gap-3 px-3" style={{ minHeight: 48, border: `1px solid ${T.border}`, borderRadius: RADIUS.md, cursor: "pointer" }}>
              <input id={`med-${m}`} type="checkbox" checked={meds[m]} onChange={() => setMeds({ ...meds, [m]: !meds[m] })} style={{ width: 20, height: 20, accentColor: T.brand }} />
              <Pill size={16} color={T.textMuted} aria-hidden />
              <span style={{ fontSize: SIZE.body, color: T.text }}>{m}</span>
              <span style={{ fontSize: SIZE.sm, color: meds[m] ? T.success : T.textMuted, marginLeft: "auto", fontWeight: meds[m] ? 600 : 400 }}>{meds[m] ? "Taken" : "Not yet"}</span>
            </label>
          ))}
        </div>
      </Card>
      <Button kind="primary" size="lg" full onClick={() => setLogged(true)}>{logged ? <><Check size={18} aria-hidden /> Saved for today</> : "Save today's check-in"}</Button>
      {logged && <p style={{ fontSize: SIZE.sm, color: T.textMuted, textAlign: "center" }}>In the demo, check-ins aren't kept after you leave the page.</p>}
      <Button kind="quiet" full onClick={openDossier}><FileText size={16} aria-hidden /> Preview the summary for my doctor</Button>
    </div>
  );
}

function InsightCard({ tag, confidence, headline, children }: { tag: string; confidence: string; headline: string; children: ReactNode }) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2"><StatusPill tone="info">{tag}</StatusPill><span style={{ fontSize: SIZE.xs, color: T.textMuted }}>{confidence}</span></div>
      <h2 style={{ fontSize: SIZE.md, fontWeight: 600, color: T.text, marginTop: 10, lineHeight: 1.35 }}>{headline}</h2>
      <div className="mt-3">{children}</div>
    </Card>
  );
}

export function Insights() {
  return (
    <div className="flex flex-col gap-4">
      <PageTitle title="Insights" sub="Patterns found in your own data." />
      <InsightCard tag="Cycle pattern" confidence="3 cycles of data" headline="Acne is worst in the week before your period.">
        <div style={{ height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={DEMO_SERIES.acneByPhase} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid stroke={T.border} vertical={false} />
              <XAxis dataKey="phase" tick={axis} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={axis} axisLine={false} tickLine={false} />
              <Bar dataKey="acne" name="Acne (0-10)" radius={[3, 3, 0, 0]}>
                {DEMO_SERIES.acneByPhase.map((d) => <Cell key={d.phase} fill={d.phase === "Luteal" ? SERIES[0] : SERIES[1]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p style={{ fontSize: SIZE.sm, color: T.textMuted, marginTop: 6 }}>Severity peaks in the luteal phase (darker bar). Worth mentioning to your clinician.</p>
      </InsightCard>
      <InsightCard tag="Change detected" confidence="12 weeks of data" headline="Your skin has calmed since you started inositol.">
        <p style={{ fontSize: SIZE.sm, color: T.textMuted }}>Acne severity went from 7 to 3 over eight weeks. See the Trials tab for the detail.</p>
      </InsightCard>
    </div>
  );
}

export function Trials() {
  return (
    <div className="flex flex-col gap-4">
      <PageTitle title="Trials" sub="Try one change for 8 weeks and see if it moved anything." />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span style={{ fontSize: SIZE.md, fontWeight: 600, color: T.text }}>Inositol, 4 g daily</span>
          <StatusPill tone="info">Week 6 of 8</StatusPill>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3" style={{ fontSize: SIZE.xs, color: T.textMuted }}>
          <span className="flex items-center gap-1.5"><span style={{ width: 12, height: 10, background: SERIES[1], borderRadius: 2 }} />Doses taken (%)</span>
          <span className="flex items-center gap-1.5"><span style={{ width: 14, height: 3, background: SERIES[0] }} />Acne (0-10)</span>
        </div>
        <div style={{ height: 160, marginTop: 6 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={DEMO_SERIES.trial} margin={{ top: 6, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid stroke={T.border} vertical={false} />
              <XAxis dataKey="wk" tick={axis} axisLine={false} tickLine={false} interval={1} />
              <YAxis yAxisId="acne" domain={[0, 10]} tick={axis} axisLine={false} tickLine={false} />
              <YAxis yAxisId="adh" domain={[0, 100]} hide />
              <Tooltip contentStyle={{ borderRadius: RADIUS.md, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: FONT.sans }} />
              <ReferenceLine yAxisId="acne" x="W4" stroke={T.textMuted} strokeDasharray="3 3" label={{ value: "started", fontSize: 10, fill: T.textMuted, position: "top" }} />
              <Bar yAxisId="adh" dataKey="adh" name="Doses taken (%)" barSize={10} radius={[2, 2, 0, 0]} fill={SERIES[1]} />
              <Line yAxisId="acne" type="monotone" dataKey="acne" name="Acne (0-10)" stroke={SERIES[0]} strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3"><Notice tone="success" title="Looking promising">With doses above 90%, your acne dropped about 4 points. Two weeks left before the trial reads out.</Notice></div>
      </Card>
      <Card>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p style={{ fontSize: SIZE.body, fontWeight: 600, color: T.text }}>Earlier bedtime</p>
            <p style={{ fontSize: SIZE.sm, color: T.textMuted }}>No clear effect on your energy. Archived.</p>
          </div>
          <StatusPill tone="neutral">Completed</StatusPill>
        </div>
      </Card>
      <Button kind="secondary" size="lg" full disabled>Start a new trial</Button>
      <p style={{ fontSize: SIZE.sm, color: T.textMuted, textAlign: "center" }}>Starting a trial isn't in the demo yet. Talk to your clinician before adding a supplement or medicine.</p>
    </div>
  );
}
