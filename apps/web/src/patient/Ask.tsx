/**
 * Ask about her record. Answers come only from the sections she shares, name what they read, and never interpret
 * results or advise treatment. The conversation isn't saved; each read by Claude is logged in her record.
 */
import { useEffect, useRef, useState } from "react";
import { SECTION, type Patient, type SectionKey, type World } from "@attune/domain";
import { RADIUS, SIZE, T } from "../design/tokens";
import { ask, useGatewayStatus } from "../shared/assistant";
import { Button, Chip, Ink, Notice, Overline, Paper, inputStyle } from "../shared/ui";
import { EngineLine } from "./Composer";
import { Body, Screen, Small } from "./Screen";

const SUGGESTED = [
  "How did I sleep this week?",
  "What was my last A1c?",
  "When is my visit?",
  "What's in my Patient Pack?",
  "What did I share with my doctors?",
];

type Turn = { role: "user"; text: string } | { role: "assistant"; text: string; by: string; sections: SectionKey[] };

export function Ask({ w, patient, q }: { w: World; patient: Patient; q: string }) {
  const status = useGatewayStatus();
  const [thread, setThread] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const asked = useRef(false);

  const submit = async (question: string) => {
    const text = question.trim();
    if (!text || busy) return;
    setDraft("");
    setError(null);
    setBusy(true);
    const history = thread.map((t) => ({ role: t.role, text: t.text }));
    setThread((t) => [...t, { role: "user", text }]);
    try {
      const a = await ask(w, patient.id, text, history, status);
      setThread((t) => [...t, { role: "assistant", text: a.text, by: a.by, sections: a.sections }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The assistant didn't answer. Try again.");
    } finally {
      setBusy(false);
    }
  };

  // A question carried over from Home asks itself once, then leaves the address bar clean.
  useEffect(() => {
    if (!q || asked.current || status === null) return;
    asked.current = true;
    window.history.replaceState(null, "", "#/ask");
    void submit(q);
  }, [q, status]);

  return (
    <Screen overline="Ask" title="Ask about your record" sub="Your stats, labs, visit and Patient Pack, from what you share.">
      <Notice>Answers come only from what you share. It can't diagnose or advise treatment; ask your care team what results mean.</Notice>
      {thread.length === 0 && (
        <Paper seed={71} torn={false}>
          <Overline>Try asking</Overline>
          <div className="flex flex-wrap gap-2" style={{ marginTop: 10 }}>
            {SUGGESTED.map((s) => <Chip key={s} selected={false} onClick={() => void submit(s)}>{s}</Chip>)}
          </div>
        </Paper>
      )}
      <ol className="flex flex-col gap-3" style={{ listStyle: "none", margin: 0, padding: 0 }} aria-live="polite">
        {thread.map((t, i) =>
          t.role === "user" ? (
            <li key={i} style={{ alignSelf: "flex-end", maxWidth: "88%", background: T.forest, color: T.cream, borderRadius: RADIUS.md, padding: "10px 14px", fontSize: SIZE.body, lineHeight: 1.45 }}>
              {t.text}
            </li>
          ) : (
            <li key={i}>
              <Paper seed={72 + i} torn={false}>
                <Small style={{ fontWeight: 600, color: T.raspberry }}>{t.by}</Small>
                <Body style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{t.text}</Body>
                <Small style={{ marginTop: 8 }}>
                  Read: {t.sections.length ? t.sections.map((s) => SECTION[s].label.toLowerCase()).join(", ") : "nothing from your record"}
                </Small>
              </Paper>
            </li>
          ),
        )}
      </ol>
      {busy && <Ink>looking through what you shared…</Ink>}
      {error && <Notice tone="issue">{error}</Notice>}
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(draft);
        }}
      >
        <label htmlFor="ask-input" style={{ fontSize: SIZE.sm, fontWeight: 600, color: T.forest }}>Your question</label>
        <input
          id="ask-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="How has my energy been?"
          autoComplete="off"
          style={{ ...inputStyle, background: T.cream }}
        />
        <Button type="submit" full disabled={!draft.trim() || busy}>Ask</Button>
      </form>
      <EngineLine w={w} />
      <Small>This conversation isn't saved. Each time Claude reads your record, it shows under “Who viewed your record”.</Small>
    </Screen>
  );
}
