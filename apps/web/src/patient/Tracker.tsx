import { useState, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, Cell, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, Camera, Check, Cookie, FileText, FlaskConical, Flame, Moon, Pill, SmilePlus, TrendingDown, Zap } from "lucide-react";
import { DEMO_PATIENT, DEMO_SERIES } from "@attune/domain";
import { C, SERIF } from "../shared/theme";
import { Eyebrow } from "../shared/ui";

const card = { background: C.white, border: `1px solid ${C.line}` };
const SYMPTOM_ICONS = { Acne: Flame, Cravings: Cookie, Energy: Zap, Sleep: Moon, Mood: SmilePlus };
type Symptom = keyof typeof SYMPTOM_ICONS;

function Dots({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1.5" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} role="radio" aria-checked={value === n} aria-label={`${label} ${n} of 5`} onClick={() => onChange(n)} className="rounded-full"
          style={{ width: 22, height: 22, border: `1.5px solid ${value >= n ? C.coral : C.line}`, background: value >= n ? C.coral : "transparent", cursor: "pointer", transition: "all .12s" }} />
      ))}
    </div>
  );
}

export function Today({ openDossier }: { openDossier: () => void }) {
  const [sym, setSym] = useState<Record<Symptom, number>>({ Acne: 3, Cravings: 4, Energy: 2, Sleep: 3, Mood: 3 });
  const [meds, setMeds] = useState<Record<string, boolean>>({ Inositol: true, Metformin: false, "Vitamin D": true });
  const [logged, setLogged] = useState(false);
  return (
    <div>
      <p style={{ fontFamily: SERIF, fontSize: 26, lineHeight: 1.15, color: C.ink, marginTop: 4 }}>Good morning, {DEMO_PATIENT.firstName}.</p>
      <p style={{ color: C.slate, fontSize: 14, marginTop: 6 }}>Day 34. Your follicular stretch runs long, and that's expected for you.</p>
      <div className="rounded-3xl p-5 mt-5" style={card}>
        <div className="flex items-center justify-between">
          <Eyebrow>20-second check-in</Eyebrow>
          <span style={{ fontSize: 11, color: C.slate2 }}>5 things that matter for you</span>
        </div>
        <div className="mt-4 flex flex-col gap-3.5">
          {(Object.keys(sym) as Symptom[]).map((k) => {
            const Icon = SYMPTOM_ICONS[k];
            return (
              <div key={k} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5"><Icon size={17} color={C.plum} /><span style={{ fontSize: 14, color: C.ink }}>{k}</span></div>
                <Dots label={k} value={sym[k]} onChange={(v) => { setSym({ ...sym, [k]: v }); setLogged(false); }} />
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4" style={{ borderTop: `1px dashed ${C.line}` }}>
          <button className="flex items-center gap-2 rounded-2xl px-3 py-2.5 w-full" style={{ background: C.mist, color: C.plum, cursor: "pointer" }}>
            <Camera size={17} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Add a skin / hair photo</span>
            <span style={{ fontSize: 11, color: C.slate2, marginLeft: "auto" }}>tracks Ferriman-Gallwey over time</span>
          </button>
        </div>
      </div>
      <div className="rounded-3xl p-5 mt-4" style={card}>
        <Eyebrow color={C.plum}>Today's plan</Eyebrow>
        <div className="mt-3 flex flex-col gap-2">
          {Object.keys(meds).map((m) => (
            <button key={m} aria-pressed={meds[m]} onClick={() => setMeds({ ...meds, [m]: !meds[m] })} className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
              style={{ background: meds[m] ? C.coralSoft : C.patientBg, border: `1px solid ${meds[m] ? "transparent" : C.line}`, cursor: "pointer" }}>
              <div className="rounded-full flex items-center justify-center" style={{ width: 22, height: 22, background: meds[m] ? C.coral : "transparent", border: `1.5px solid ${meds[m] ? C.coral : C.slate2}` }}>
                {meds[m] && <Check size={14} color="white" />}
              </div>
              <Pill size={15} color={C.slate} />
              <span style={{ fontSize: 14, color: C.ink }}>{m}</span>
              <span style={{ fontSize: 11, color: C.slate2, marginLeft: "auto" }}>{meds[m] ? "Taken" : "Tap when taken"}</span>
            </button>
          ))}
        </div>
      </div>
      <button onClick={() => setLogged(true)} className="w-full rounded-2xl py-3.5 mt-4 flex items-center justify-center gap-2"
        style={{ background: logged ? C.green : C.coral, color: "white", cursor: "pointer", fontWeight: 700, fontSize: 15 }}>
        {logged ? <><Check size={18} /> Logged · 6-day streak</> : "Save today's check-in"}
      </button>
      <button onClick={openDossier} className="w-full rounded-2xl py-3 mt-3 flex items-center justify-center gap-2"
        style={{ background: "transparent", color: C.plum, cursor: "pointer", fontWeight: 600, fontSize: 13.5, border: `1px solid ${C.line}` }}>
        <FileText size={16} /> Preview my clinician dossier
      </button>
    </div>
  );
}

function InsightCard({ tag, tagColor, headline, confidence, children }: { tag: string; tagColor: string; headline: string; confidence: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl p-5 mt-4" style={card}>
      <div className="flex items-center justify-between">
        <span className="rounded-full px-2.5 py-1" style={{ fontSize: 10.5, fontWeight: 700, background: tagColor + "22", color: tagColor }}>{tag}</span>
        <span style={{ fontSize: 11, color: C.slate2 }}>{confidence}</span>
      </div>
      <p style={{ fontFamily: SERIF, fontSize: 18, lineHeight: 1.3, color: C.ink, marginTop: 12 }}>{headline}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function Insights() {
  return (
    <div>
      <p style={{ fontFamily: SERIF, fontSize: 24, color: C.ink, marginTop: 6 }}>What your body is telling us</p>
      <p style={{ color: C.slate, fontSize: 13.5, marginTop: 4 }}>Patterns Attune found in your own data, not generic advice.</p>
      <InsightCard tag="CYCLE PATTERN" tagColor={C.plum} confidence="Strong signal · 3 cycles" headline="Your acne flares track with your luteal phase.">
        <div style={{ height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={DEMO_SERIES.acneByPhase} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
              <XAxis dataKey="phase" tick={{ fontSize: 10, fill: C.slate }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: C.slate2 }} axisLine={false} tickLine={false} />
              <Bar dataKey="acne" radius={[6, 6, 0, 0]}>
                {DEMO_SERIES.acneByPhase.map((d) => <Cell key={d.phase} fill={d.phase === "Luteal" ? C.coral : C.lavender} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p style={{ fontSize: 12.5, color: C.slate, marginTop: 6 }}>Severity peaks in the ~8 days before your period. Worth timing skin care and flagging to your clinician.</p>
      </InsightCard>
      <InsightCard tag="RESPONSE DETECTED" tagColor={C.green} confidence="8 weeks of data" headline="Skin has steadily calmed since you started inositol.">
        <div style={{ height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={DEMO_SERIES.trial} margin={{ top: 4, right: 6, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="acneFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.coral} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={C.coral} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="wk" tick={{ fontSize: 9, fill: C.slate2 }} axisLine={false} tickLine={false} interval={2} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: C.slate2 }} axisLine={false} tickLine={false} />
              <ReferenceLine x="W4" stroke={C.plum} strokeDasharray="3 3" />
              <Area type="monotone" dataKey="acne" stroke={C.coral} strokeWidth={2.5} fill="url(#acneFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p style={{ fontSize: 12.5, color: C.slate, marginTop: 6 }}>Acne severity fell from 7 to 3 over eight weeks. The dashed line marks when inositol began.</p>
      </InsightCard>
    </div>
  );
}

export function Trials() {
  return (
    <div>
      <p style={{ fontFamily: SERIF, fontSize: 24, color: C.ink, marginTop: 6 }}>Your trials</p>
      <p style={{ color: C.slate, fontSize: 13.5, marginTop: 4 }}>Try one thing for 8 weeks. Attune reads whether it moved anything.</p>
      <div className="rounded-3xl p-5 mt-4" style={card}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><FlaskConical size={17} color={C.coral} /><span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>Inositol · 4 g daily</span></div>
          <span className="rounded-full px-2.5 py-1" style={{ fontSize: 10.5, fontWeight: 700, background: C.coralSoft, color: C.coralDeep }}>Week 6 of 8</span>
        </div>
        <p style={{ fontSize: 12, color: C.slate2, marginTop: 10, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Adherence vs. acne severity</p>
        <div style={{ height: 150, marginTop: 4 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={DEMO_SERIES.trial} margin={{ top: 6, right: 4, left: -24, bottom: 0 }}>
              <XAxis dataKey="wk" tick={{ fontSize: 9, fill: C.slate2 }} axisLine={false} tickLine={false} interval={1} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: C.slate2 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${C.line}`, fontSize: 12 }} />
              <ReferenceLine x="W4" stroke={C.plum} strokeDasharray="3 3" />
              <Bar dataKey="adh" name="Adherence %" barSize={12} radius={[3, 3, 0, 0]} fill={C.lavender} />
              <Line type="monotone" dataKey="acne" name="Acne (0-10)" stroke={C.coral} strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl p-3.5 mt-3 flex gap-3" style={{ background: C.greenSoft }}>
          <TrendingDown size={20} color={C.green} style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 13, color: C.ink, lineHeight: 1.45 }}><b>Looking promising.</b> With adherence above 90%, your acne dropped ~4 points. Two weeks left before Attune calls it.</p>
        </div>
      </div>
      <div className="rounded-3xl p-4 mt-4 flex items-center gap-3" style={card}>
        <div className="rounded-full flex items-center justify-center" style={{ width: 34, height: 34, background: C.mist }}><Check size={17} color={C.plum} /></div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>Earlier bedtime · completed</p>
          <p style={{ fontSize: 12, color: C.slate }}>No clear effect on energy for you. Archived.</p>
        </div>
      </div>
      <button className="w-full rounded-2xl py-3.5 mt-4 flex items-center justify-center gap-2" style={{ background: C.ink, color: "white", cursor: "pointer", fontWeight: 700, fontSize: 14.5 }}>
        Start a new trial <ArrowRight size={17} />
      </button>
      <p style={{ fontSize: 11.5, color: C.slate2, textAlign: "center", marginTop: 8 }}>Suggested for your type: berberine · myo-inositol ratio · resistance training</p>
    </div>
  );
}
