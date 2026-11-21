/**
 * Journal: notes she writes here or in her AI assistant, and the updates that assistant suggested. Suggestions change
 * nothing until she applies them. The conversation itself happens in the assistant's own app; Attune holds the
 * record. The last ten notes show here; older ones stay in her record (no endless feed).
 */
import { useState } from "react";
import { AI_ASSISTANTS, activeLink, assistantInfo, describeProposal, type Patient, type ProposalRecord, type World } from "@attune/domain";
import { SIZE, T } from "../design/tokens";
import { when } from "../shared/format";
import { Button, Notice, Overline, Paper, StatusPill, Tag, Voice, inputStyle, useAct, useToast } from "../shared/ui";
import { ME, go } from "./nav";
import { Body, Screen, SectionLabel, Small } from "./Screen";

const SHOWN = 10;
type Run = ReturnType<typeof useAct>;

function Suggestion({ d, run }: { d: ProposalRecord; run: Run }) {
  return (
    <div style={{ borderTop: `1px solid ${T.hairline}`, paddingTop: 12, marginTop: 12 }}>
      <Body style={{ fontWeight: 600 }}>{describeProposal(d.proposal)}</Body>
      {d.why && <Small style={{ marginTop: 2 }}>From {assistantInfo(d.by)?.name ?? "your assistant"}: “{d.why}”</Small>}
      <div className="flex flex-wrap items-center gap-2" style={{ marginTop: 8 }}>
        <Button size="md" onClick={() => run({ ...ME, type: "applyProposal", proposalId: d.id }, "Applied to your record.")}>Apply</Button>
        <Button size="md" variant="quiet" onClick={() => run({ ...ME, type: "dismissProposal", proposalId: d.id }, "Dismissed. Nothing changed.")}>Dismiss</Button>
      </div>
    </div>
  );
}

function Waiting({ pending, run }: { pending: ProposalRecord[]; run: Run }) {
  const names = [...new Set(pending.map((d) => assistantInfo(d.by)?.name ?? "your assistant"))].join(" and ");
  const applyAll = () => {
    for (const d of pending) if (!run({ ...ME, type: "applyProposal", proposalId: d.id })) return;
  };
  return (
    <Paper seed={61}>
      <Overline>Waiting for you</Overline>
      <Voice as="h2" size={SIZE.xl} style={{ marginTop: 6 }}>{pending.length} suggested update{pending.length === 1 ? "" : "s"}</Voice>
      <Small style={{ marginTop: 4 }}>From {names}. Nothing changes in your record until you apply.</Small>
      {pending.map((d) => <Suggestion key={d.id} d={d} run={run} />)}
      {pending.length >= 2 && (
        <div style={{ marginTop: 14 }}>
          <Button full variant="secondary" onClick={applyAll}>Apply all {pending.length}</Button>
        </div>
      )}
    </Paper>
  );
}

function NoteBox({ patient, run }: { patient: Patient; run: Run }) {
  const [text, setText] = useState("");
  const save = () => {
    if (run({ ...ME, type: "writeJournal", patientId: patient.id, text, assistantId: null }, "Saved to your journal.")) setText("");
  };
  return (
    <Paper seed={62} torn={false}>
      <Overline>Write a note</Overline>
      <textarea
        aria-label="Write a note in your journal"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Anything you want to remember or tell your doctors…"
        style={{ ...inputStyle, resize: "vertical", marginTop: 10, lineHeight: 1.5, background: T.cream }}
      />
      <div style={{ marginTop: 10 }}>
        <Button full variant="secondary" onClick={save} disabled={!text.trim()}>Save note</Button>
      </div>
    </Paper>
  );
}

export function Journal({ w, patient }: { w: World; patient: Patient }) {
  const [toast, show] = useToast();
  const run = useAct(show);
  const entries = w.journal.filter((j) => j.patientId === patient.id).slice().reverse();
  const mine = w.proposals.filter((p) => p.patientId === patient.id);
  const pending = mine.filter((p) => p.status === "pending");
  const decided = mine.filter((p) => p.status !== "pending").slice(-5).reverse();
  const connected = AI_ASSISTANTS.some((a) => activeLink(w, patient.id, a.id));

  return (
    <Screen overline="Journal" title="In your words" sub="Notes you write here or tell your AI assistant. What it suggests waits for you.">
      {pending.length > 0 && <Waiting pending={pending} run={run} />}
      {!connected && (
        <Notice title="Journal in Claude or ChatGPT">
          Connect your assistant and just tell it how you are. It saves your words here and suggests updates for you to approve.{" "}
          <button type="button" onClick={() => go("/assistants")} style={{ color: T.raspberry, textDecoration: "underline", cursor: "pointer", fontSize: SIZE.sm, minHeight: 44 }}>Connect an assistant</button>
        </Notice>
      )}
      <NoteBox patient={patient} run={run} />
      <SectionLabel>Recent notes</SectionLabel>
      {entries.length === 0 ? (
        <Paper seed={63} torn={false}><Body muted>Nothing yet. Your journal stays private unless you share it.</Body></Paper>
      ) : (
        entries.slice(0, SHOWN).map((e, i) => {
          const from = e.source !== "patient" ? assistantInfo(e.source)?.name : null;
          return (
            <Paper key={e.id} seed={64 + i} torn={false}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Small>{when(e.at)}</Small>
                {from && <Tag tone="rose">Written in {from}</Tag>}
              </div>
              <Body style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{e.text}</Body>
            </Paper>
          );
        })
      )}
      {entries.length > SHOWN && <Small>Older notes stay in your record.</Small>}
      {decided.length > 0 && (
        <>
          <SectionLabel>Recently decided</SectionLabel>
          <Paper seed={75} torn={false}>
            {decided.map((d) => (
              <div key={d.id} className="flex items-start justify-between gap-3" style={{ padding: "8px 0", borderTop: `1px solid ${T.hairline}` }}>
                <Body style={{ fontSize: SIZE.sm }}>{describeProposal(d.proposal)}</Body>
                <StatusPill tone={d.status === "applied" ? "done" : "neutral"} label={d.status === "applied" ? "Applied" : "Dismissed"} />
              </div>
            ))}
          </Paper>
        </>
      )}
      {toast}
    </Screen>
  );
}
