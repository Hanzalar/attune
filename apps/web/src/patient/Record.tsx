/**
 * My Record: what's in each section, who can see it, her story in her own words, and who has looked.
 */
import { useState, type ReactNode } from "react";
import { ALL_SECTIONS, DEMO_TZ, SECTION, canSee, nameOf, recipientsOf, todayIn, type Patient, type SectionKey, type World } from "@attune/domain";
import { SIZE, T } from "../design/tokens";
import { ago, dateShort, when } from "../shared/format";
import { Trends } from "../shared/Trends";
import { Button, Field, Overline, Paper, inputStyle, useAct, useToast } from "../shared/ui";
import { ME, go } from "./nav";
import { Body, Screen, SectionLabel, Small } from "./Screen";

function Who({ w, patient, section }: { w: World; patient: Patient; section: SectionKey }) {
  const names = recipientsOf(w, patient.id).filter((r) => canSee(w, patient.id, r, section)).map((r) => nameOf(w, r));
  return (
    <p style={{ fontSize: SIZE.sm, color: T.inkMuted, margin: "12px 0 0", paddingTop: 10, borderTop: `1px solid ${T.hairline}` }}>
      <strong style={{ color: T.forest, fontWeight: 600 }}>Who can see this: </strong>
      {names.length ? names.join(", ") : "Only you"}
    </p>
  );
}

function Block({ section, children, w, patient, seed }: { section: SectionKey; children: ReactNode; w: World; patient: Patient; seed: number }) {
  return (
    <Paper seed={seed} torn={false}>
      <Overline>{SECTION[section].label}</Overline>
      <div className="flex flex-col gap-2" style={{ marginTop: 10 }}>{children}</div>
      <Who w={w} patient={patient} section={section} />
    </Paper>
  );
}

function Story({ patient }: { patient: Patient }) {
  const [toast, show] = useToast();
  const run = useAct(show);
  const [editing, setEditing] = useState(false);
  const [words, setWords] = useState(patient.story?.words ?? "");
  const story = patient.story;
  if (!story) return <Body muted>Not started yet.</Body>;
  return (
    <>
      {editing ? (
        <div className="flex flex-col gap-2">
          <Field label="Your story, in your words" htmlFor="story" hint="What you'd want every doctor to know before you walk in.">
            <textarea id="story" rows={5} value={words} onChange={(e) => setWords(e.target.value)} style={{ ...inputStyle, resize: "vertical" }} />
          </Field>
          <Button full onClick={() => { if (run({ ...ME, type: "editStory", patientId: patient.id, words }, "Saved.")) setEditing(false); }}>Save</Button>
          <Button full variant="quiet" onClick={() => { setWords(story.words); setEditing(false); }}>Cancel</Button>
        </div>
      ) : (
        <>
          {story.words ? <p className="voice" style={{ fontSize: SIZE.lg, lineHeight: 1.3, color: T.wine, margin: 0 }}>“{story.words}”</p> : <Body muted>Nothing written yet.</Body>}
          <Button variant="secondary" size="md" onClick={() => setEditing(true)}>{story.words ? "Edit your words" : "Write it in your words"}</Button>
        </>
      )}
      <Small>Hardest lately: {story.hardest.join(", ") || "—"}</Small>
      <Small>Wants help with: {story.helpWith.join(", ") || "—"}</Small>
      <Small>Has tried: {story.tried.join(", ") || "—"}</Small>
      {toast}
    </>
  );
}

export function Record({ w, patient, now }: { w: World; patient: Patient; now: string }) {
  const plan = patient.insurance ? w.plans.find((p) => p.id === patient.insurance?.planId) : undefined;
  const summaries = w.summaries.filter((s) => w.referrals.some((r) => r.id === s.referralId && r.patientId === patient.id));
  const views = w.views.filter((v) => v.patientId === patient.id).sort((a, b) => b.at.localeCompare(a.at));

  const content: Record<SectionKey, ReactNode> = {
    story: <Story patient={patient} />,
    trends: patient.checkIns.length ? <Trends checkIns={patient.checkIns} today={todayIn(now, DEMO_TZ)} /> : <Body muted>No check-ins yet.</Body>,
    results: patient.results.length ? (
      patient.results.map((r) => (
        <div key={`${r.name}-${r.collectedOn}`}>
          <Body><strong>{r.name}</strong> <span className="tnum">{r.value}</span> <span style={{ color: T.inkMuted }}>(lab range {r.range})</span></Body>
          <Small>{dateShort(r.collectedOn)} · {r.source}</Small>
        </div>
      ))
    ) : <Body muted>No results yet. Your PCP's office can add them to a referral.</Body>,
    meds: patient.meds.length ? patient.meds.map((m) => <Body key={m.name}><strong>{m.name}</strong>, {m.detail.toLowerCase()}, since {m.since} <span style={{ color: T.inkMuted }}>({m.source})</span></Body>) : <Body muted>None listed.</Body>,
    insurance: patient.insurance && plan ? (
      <>
        <Body>{plan.carrier} · {plan.name} ({plan.type}) · member ID ending <span className="tnum">{patient.insurance.memberIdLast4}</span></Body>
        <a href="#/insurance" style={{ color: T.raspberry, fontSize: SIZE.body, minHeight: 44, display: "inline-flex", alignItems: "center", textDecoration: "underline", textUnderlineOffset: 3 }}>Insurance details</a>
      </>
    ) : <Button variant="secondary" size="md" onClick={() => go("/insurance")}>Add your insurance card</Button>,
    summaries: summaries.length ? (
      summaries.map((s) => (
        <div key={s.id}>
          <Body><strong>{nameOf(w, s.practiceId)}</strong>, {dateShort(s.at)}</Body>
          <a href="#/summary" style={{ color: T.raspberry, fontSize: SIZE.body, minHeight: 44, display: "inline-flex", alignItems: "center", textDecoration: "underline", textUnderlineOffset: 3 }}>Read it</a>
        </div>
      ))
    ) : <Body muted>After a specialist visit, the summary lands here.</Body>,
  };

  return (
    <Screen overline="My record" title="Yours, in one place" sub="What's in it, who can see each part, and who has looked.">
      {ALL_SECTIONS.map((s, i) => (
        <Block key={s} section={s} w={w} patient={patient} seed={40 + i}>{content[s]}</Block>
      ))}
      <div className="flex flex-col gap-2">
        <Button full variant="secondary" onClick={() => go("/pack")}>Preview your Patient Pack</Button>
        <Button full variant="secondary" onClick={() => go("/share")}>Share with my doctor</Button>
      </div>

      <SectionLabel>Who viewed your record</SectionLabel>
      <Paper seed={49} torn={false}>
        {views.length === 0 ? (
          <Body muted>Nobody has opened it yet.</Body>
        ) : (
          <ol className="flex flex-col" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {views.map((v) => (
              <li key={`${v.at}-${v.viewer}`} style={{ padding: "10px 0", borderBottom: `1px solid ${T.hairline}` }}>
                <Body><strong>{v.viewer}</strong> at {nameOf(w, v.recipientId)}</Body>
                <Small>{when(v.at)} ({ago(v.at, now)}) · {v.sections.map((s) => SECTION[s].label.toLowerCase()).join(", ")}</Small>
              </li>
            ))}
          </ol>
        )}
        <Small style={{ marginTop: 10 }}>Every look is logged. You can stop sharing any part in Care team.</Small>
      </Paper>
    </Screen>
  );
}
