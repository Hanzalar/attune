/**
 * The journal composer: write anything, save it to the journal or ask about the record. Used on Home (the main
 * event) and on the Journal screen. Saving keeps her words first; the assistant's reply and drafts arrive after.
 */
import { useState, useSyncExternalStore } from "react";
import type { World } from "@attune/domain";
import { SIZE, T } from "../design/tokens";
import { engineFor, journal, useGatewayStatus } from "../shared/assistant";
import { Button, Overline, Paper, Voice, inputStyle } from "../shared/ui";
import { PATIENT_ID, go } from "./nav";
import { Small } from "./Screen";

/** Whether a journal reply is in flight, and the last error. Module-level so it survives leaving Home for Journal. */
let state: { busy: boolean; error: string | null } = { busy: false, error: null };
const listeners = new Set<() => void>();
const set = (next: typeof state) => {
  state = next;
  listeners.forEach((l) => l());
};

export function useJournalStatus() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

export function clearJournalError() {
  set({ ...state, error: null });
}

/** One line saying who reads her words, so the engine is never a mystery. */
export function EngineLine({ w }: { w: World }) {
  const status = useGatewayStatus();
  const engine = engineFor(w, PATIENT_ID, status);
  return (
    <Small>
      {engine.kind === "claude" ? "Claude reads only what you share · drafts wait for you" : "Demo replies (no AI model) · nothing leaves your device"}
      {" · "}
      <a href="#/assistants" style={{ color: T.raspberry, textDecoration: "underline", textUnderlineOffset: 3 }}>
        {engine.kind === "claude" ? "Manage" : "Set up Claude"}
      </a>
    </Small>
  );
}

export function Composer({ w, onHome }: { w: World; onHome?: boolean }) {
  const status = useGatewayStatus();
  const { busy } = useJournalStatus();
  const [text, setText] = useState("");
  const pending = w.proposals.filter((p) => p.patientId === PATIENT_ID && p.status === "pending").length;

  const save = () => {
    const words = text.trim();
    if (!words || busy) return;
    set({ busy: true, error: null });
    setText("");
    void journal(w, PATIENT_ID, words, status).then((error) => set({ busy: false, error }));
    if (onHome) go("/journal");
  };

  const askIt = () => {
    const words = text.trim();
    go(words ? `/ask?q=${encodeURIComponent(words)}` : "/ask");
  };

  return (
    <Paper seed={onHome ? 4 : 61} className="rise">
      <Overline>Journal · Ask</Overline>
      <Voice as="h2" size={SIZE.xl} style={{ marginTop: 8 }}>What's on your mind?</Voice>
      <textarea
        id={onHome ? "journal-home" : "journal-page"}
        aria-label="Write in your journal, or ask about your record"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Slept badly again, skin broke out…"
        style={{ ...inputStyle, resize: "vertical", marginTop: 12, lineHeight: 1.5, background: T.cream }}
      />
      <div className="flex flex-col gap-2" style={{ marginTop: 12 }}>
        <Button full onClick={save} disabled={!text.trim() || busy}>{busy ? "Saving…" : "Save to journal"}</Button>
        <Button full variant="secondary" onClick={askIt}>Ask about my record</Button>
      </div>
      <div className="flex flex-col gap-1" style={{ marginTop: 10 }}>
        <EngineLine w={w} />
        {onHome && pending > 0 && (
          <a href="#/journal" style={{ fontSize: SIZE.sm, color: T.forest, fontWeight: 600, minHeight: 44, display: "inline-flex", alignItems: "center" }}>
            {pending} update{pending === 1 ? "" : "s"} waiting for you →
          </a>
        )}
      </div>
    </Paper>
  );
}
