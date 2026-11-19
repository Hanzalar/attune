/**
 * Journal: her words first, then what the assistant drafted from them. Nothing changes in her record until she
 * applies a draft. The last ten entries show here; older ones stay in her record (no endless feed).
 */
import { assistantInfo, describeProposal, type JournalEntry, type Patient, type ProposalRecord, type World } from "@attune/domain";
import { SIZE, T } from "../design/tokens";
import { when } from "../shared/format";
import { Button, Ink, Notice, Overline, Paper, StatusPill, Tag, useAct, useToast } from "../shared/ui";
import { Composer, clearJournalError, useJournalStatus } from "./Composer";
import { ME } from "./nav";
import { Body, Screen, SectionLabel, Small } from "./Screen";

const SHOWN = 10;

function Draft({ d, run }: { d: ProposalRecord; run: ReturnType<typeof useAct> }) {
  return (
    <div style={{ borderTop: `1px solid ${T.hairline}`, paddingTop: 10, marginTop: 10 }}>
      <Body style={{ fontWeight: 600 }}>{describeProposal(d.proposal)}</Body>
      {d.why && <Small style={{ marginTop: 2 }}>From: “{d.why}”</Small>}
      {d.status === "pending" ? (
        <div className="flex flex-wrap items-center gap-2" style={{ marginTop: 8 }}>
          <Button size="md" onClick={() => run({ ...ME, type: "applyProposal", proposalId: d.id }, "Applied to your record.")}>Apply</Button>
          <Button size="md" variant="quiet" onClick={() => run({ ...ME, type: "dismissProposal", proposalId: d.id }, "Dismissed. Nothing changed.")}>Dismiss</Button>
        </div>
      ) : (
        <div style={{ marginTop: 8 }}>
          <StatusPill tone={d.status === "applied" ? "done" : "neutral"} label={d.status === "applied" ? "Applied" : "Dismissed"} size="sm" />
        </div>
      )}
    </div>
  );
}

function Drafts({ drafts, run }: { drafts: ProposalRecord[]; run: ReturnType<typeof useAct> }) {
  const pending = drafts.filter((d) => d.status === "pending");
  const applyAll = () => {
    for (const d of pending) if (!run({ ...ME, type: "applyProposal", proposalId: d.id })) return;
  };
  if (drafts.length === 0) return null;
  return (
    <div style={{ marginTop: 6 }}>
      <Overline style={{ marginTop: 12 }}>Drafted for you · nothing changes until you apply</Overline>
      {drafts.map((d) => <Draft key={d.id} d={d} run={run} />)}
      {pending.length >= 2 && (
        <div style={{ marginTop: 12 }}>
          <Button full variant="secondary" onClick={applyAll}>Apply all {pending.length}</Button>
        </div>
      )}
    </div>
  );
}

function Entry({ e, drafts, run, seed, reading }: { e: JournalEntry; drafts: ProposalRecord[]; run: ReturnType<typeof useAct>; seed: number; reading: boolean }) {
  const writtenIn = e.source !== "patient" ? assistantInfo(e.source)?.name : null;
  const replier = e.replyBy ? assistantInfo(e.replyBy) : undefined;
  return (
    <Paper seed={seed} torn={false}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Small>{when(e.at)}</Small>
        {writtenIn && <Tag tone="rose">Written in {writtenIn}</Tag>}
      </div>
      <Body style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{e.text}</Body>
      {e.reply ? (
        <div style={{ marginTop: 12, paddingLeft: 12, borderLeft: `2px solid ${T.blush}` }}>
          <Small style={{ fontWeight: 600, color: T.raspberry }}>{replier?.name ?? "Assistant"}</Small>
          <Body style={{ marginTop: 2 }}>{e.reply}</Body>
        </div>
      ) : reading ? (
        <Ink style={{ marginTop: 12 }}>reading what you wrote…</Ink>
      ) : null}
      <Drafts drafts={drafts} run={run} />
    </Paper>
  );
}

export function Journal({ w, patient }: { w: World; patient: Patient }) {
  const [toast, show] = useToast();
  const run = useAct(show);
  const { busy, error } = useJournalStatus();
  const entries = w.journal.filter((j) => j.patientId === patient.id).slice().reverse();
  const mine = w.proposals.filter((p) => p.patientId === patient.id);
  const loose = mine.filter((p) => p.entryId === null);

  return (
    <Screen overline="Journal" title="In your words" sub="Write anything. Your assistant drafts updates for your record; you decide what goes in.">
      <Composer w={w} />
      {error && (
        <Notice tone="attention" title="The assistant didn't finish">
          {error} <button type="button" onClick={clearJournalError} style={{ color: T.raspberry, textDecoration: "underline", cursor: "pointer", fontSize: SIZE.sm, minHeight: 44, padding: "0 4px" }}>Dismiss</button>
        </Notice>
      )}
      {loose.length > 0 && (
        <Paper seed={62} torn={false}>
          <Overline>From your connected assistants</Overline>
          <Small style={{ marginTop: 6 }}>Drafted in Claude or ChatGPT through Attune's connector.</Small>
          <Drafts drafts={loose} run={run} />
        </Paper>
      )}
      <SectionLabel>Recent entries</SectionLabel>
      {entries.length === 0 ? (
        <Paper seed={63} torn={false}><Body muted>Nothing yet. What you write stays private unless you share your journal.</Body></Paper>
      ) : (
        entries.slice(0, SHOWN).map((e, i) => (
          <Entry key={e.id} e={e} drafts={mine.filter((p) => p.entryId === e.id)} run={run} seed={64 + i} reading={busy && i === 0} />
        ))
      )}
      {entries.length > SHOWN && <Small>Older entries stay in your record.</Small>}
      {toast}
    </Screen>
  );
}
