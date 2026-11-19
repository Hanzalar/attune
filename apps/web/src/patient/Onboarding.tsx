/**
 * Three questions, no more. Then a short note that proves we listened, in her own words back to her. No advice,
 * no promise of a daily message: the record starts here and goes nowhere she doesn't send it.
 */
import { useEffect, useState } from "react";
import { HARDEST_OPTIONS, HELP_OPTIONS, MAX_HARDEST, TRIED_OPTIONS } from "@attune/domain";
import { RADIUS, SIZE, T } from "../design/tokens";
import { Bloom, Wordmark } from "../shared/Brand";
import { useNow } from "../shared/store";
import { Button, Chip, Ink, Overline, Paper, Voice, useAct, useToast } from "../shared/ui";
import { ME, PATIENT_ID, go, greeting, weekdayName } from "./nav";
import { Body, Small } from "./Screen";

const QUESTIONS = [
  { title: "What's been the hardest lately?", sub: `Pick up to ${MAX_HARDEST}. Nobody sees this unless you share it.`, options: HARDEST_OPTIONS, max: MAX_HARDEST, min: 1 },
  { title: "What do you want help with?", sub: "Pick any that fit.", options: HELP_OPTIONS, max: HELP_OPTIONS.length, min: 0 },
  { title: "What have you tried so far?", sub: "Pick any. “Nothing yet” is a fine answer.", options: TRIED_OPTIONS, max: TRIED_OPTIONS.length, min: 0 },
] as const;

const NOTHING = "Nothing yet";

function joinWords(items: string[]): string {
  const lower = items.map((i) => i.toLowerCase());
  if (lower.length <= 1) return lower[0] ?? "";
  return `${lower.slice(0, -1).join(", ")} and ${lower.at(-1)}`;
}

function Progress({ step }: { step: number }) {
  return (
    <div className="flex gap-2" aria-hidden>
      {QUESTIONS.map((_, i) => (
        <span key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? T.forest : T.hairline }} />
      ))}
    </div>
  );
}

const pad = { paddingLeft: "max(16px, env(safe-area-inset-left))", paddingRight: "max(16px, env(safe-area-inset-right))" };

export function Onboarding() {
  const now = useNow(60_000);
  const [toast, show] = useToast();
  const run = useAct(show);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[][]>([[], [], []]);

  useEffect(() => {
    if (window.location.hash !== "#/welcome") window.location.replace("#/welcome");
  }, []);

  if (step === QUESTIONS.length) {
    const [hardest = [], help = []] = answers;
    return (
      <div>
        <header style={{ position: "relative" }}>
          <Bloom variant="wine" style={{ position: "absolute", inset: 0 }} />
          <div className="grain" style={{ position: "relative", background: T.wine, ...pad, paddingTop: 20, paddingBottom: 12 }}>
            <Overline onDark>{weekdayName(now)} · Day 1</Overline>
            <Voice size={SIZE.display} color={T.cream} style={{ marginTop: 10 }}>{greeting(now)},<br />Ari.</Voice>
          </div>
          <div aria-hidden style={{ position: "relative", height: 150, backgroundImage: `linear-gradient(180deg, ${T.wine} 0%, transparent 100%)` }} />
        </header>
        <main className="rise flex flex-col gap-5" style={{ position: "relative", ...pad, marginTop: -110, paddingBottom: "max(32px, env(safe-area-inset-bottom))" }}>
          <Paper seed={7} style={{ padding: "22px 20px 34px" }}>
            <Body style={{ fontSize: SIZE.md, lineHeight: 1.55 }}>
              You told us {joinWords(hardest)} {hardest.length === 1 ? "has" : "have"} been the hardest
              {help.length ? `, and that you want help ${help.length === 1 ? "with this:" : "with these:"} ${joinWords(help)}` : ""}.
              So this is where your record starts: yours, in your words, shared only when you say.
            </Body>
            <Ink style={{ marginTop: 14, fontSize: SIZE.xl }}>you've told this story enough.</Ink>
          </Paper>
          <Small>You can change any of this later in your record.</Small>
          <Button full onClick={() => go("/checkin")}>Start my first check-in</Button>
        </main>
        {toast}
      </div>
    );
  }

  const q = QUESTIONS[step];
  if (!q) return null;
  const picked = answers[step] ?? [];

  const toggle = (option: string) => {
    setAnswers((prev) =>
      prev.map((list, i) => {
        if (i !== step) return list;
        if (list.includes(option)) return list.filter((o) => o !== option);
        if (step === 2) return option === NOTHING ? [NOTHING] : [...list.filter((o) => o !== NOTHING), option];
        return list.length >= q.max ? list : [...list, option];
      }),
    );
  };

  const next = () => {
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
      return;
    }
    const [hardest = [], helpWith = [], tried = []] = answers;
    if (run({ ...ME, type: "completeOnboarding", patientId: PATIENT_ID, hardest, helpWith, tried })) setStep(QUESTIONS.length);
  };

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100dvh - 32px)" }}>
      <div style={{ ...pad, paddingTop: 16 }}>
        <Wordmark size={24} />
      </div>
      <main className="rise flex flex-1 flex-col gap-5" key={step} style={{ ...pad, paddingTop: 24 }}>
        <Progress step={step} />
        <div>
          <Overline>{step + 1} of {QUESTIONS.length}</Overline>
          <Voice size={SIZE.xxl} style={{ marginTop: 10 }}>{q.title}</Voice>
          <Body muted style={{ marginTop: 10 }}>{q.sub}</Body>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label={q.title}>
          {q.options.map((o) => (
            <Chip key={o} selected={picked.includes(o)} onClick={() => toggle(o)} disabled={!picked.includes(o) && picked.length >= q.max}>
              {o}
            </Chip>
          ))}
        </div>
        {step === 0 && picked.length >= q.max && <Small>That's {MAX_HARDEST}. Tap one again to swap it out.</Small>}
        <Ink style={{ marginTop: 4 }}>take your time.</Ink>
      </main>
      <Bloom variant="soft" style={{ ...pad, paddingTop: 48, paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
        <div className="flex flex-col gap-2">
          <Button full onClick={next} disabled={picked.length < q.min}>{step === QUESTIONS.length - 1 ? "Finish" : "Continue"}</Button>
          {picked.length < q.min && <Small style={{ textAlign: "center" }}>Pick at least one to continue.</Small>}
          {step > 0 && (
            <button type="button" onClick={() => setStep(step - 1)} style={{ minHeight: 44, fontSize: SIZE.body, color: T.raspberry, cursor: "pointer", borderRadius: RADIUS.sm }}>
              Back
            </button>
          )}
        </div>
      </Bloom>
      {toast}
    </div>
  );
}
