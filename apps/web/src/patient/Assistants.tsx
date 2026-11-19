/**
 * AI assistants: connect Claude or ChatGPT the way she shares with a doctor, section by section. Claude also answers
 * inside Attune; both can reach her record through Attune's connector (MCP). The connector address carries a secret,
 * so it shows only here.
 */
import { useState } from "react";
import { Copy } from "lucide-react";
import {
  AI_ASSISTANTS, ASSISTANT_DEFAULT_SECTIONS, ASSISTANT_SECTIONS, SECTION, activeLink, canSee, type AssistantInfo, type Patient,
  type SectionKey, type World,
} from "@attune/domain";
import { RADIUS, SIZE, T } from "../design/tokens";
import { connectorUrl, newToken, useGatewayStatus, type GatewayStatus } from "../shared/assistant";
import { dateShort } from "../shared/format";
import { Button, Notice, Overline, Paper, Toggle, Voice, useAct, useToast } from "../shared/ui";
import { ME } from "./nav";
import { Body, Screen, SectionLabel, Small } from "./Screen";

type Run = ReturnType<typeof useAct>;

function InAppStatus({ status }: { status: GatewayStatus | null }) {
  if (status === null) return <Small>Checking whether Claude can answer here…</Small>;
  return status.ready ? (
    <Small>Claude answers inside Attune{status.model ? ` (model ${status.model})` : ""}.</Small>
  ) : (
    <Small>{status.reason ?? "Claude isn't available here yet."} Until then, demo replies answer, labelled as such.</Small>
  );
}

function ConnectorBox({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="flex flex-col gap-2" style={{ marginTop: 12 }}>
      <Overline>Connector address · keep it private</Overline>
      <code className="tnum" style={{ display: "block", background: T.bone, border: `1px solid ${T.hairline}`, borderRadius: RADIUS.sm, padding: "10px 12px", fontSize: SIZE.sm, color: T.forest, overflowWrap: "anywhere", fontFamily: "inherit" }}>
        {url}
      </code>
      <Button size="md" variant="secondary" icon={<Copy size={16} aria-hidden />} onClick={() => void copy()}>{copied ? "Copied" : "Copy address"}</Button>
      <Small>
        Add it as a custom connector (MCP) in Claude or ChatGPT. Both need a public HTTPS address; for a local test use a tunnel, or in Claude Code run:
        {" "}<span className="tnum" style={{ color: T.forest, overflowWrap: "anywhere" }}>claude mcp add --transport http attune {url}</span>
      </Small>
    </div>
  );
}

function NotConnected({ a, patient, run }: { a: AssistantInfo; patient: Patient; run: Run }) {
  const [sections, setSections] = useState<SectionKey[]>([...ASSISTANT_DEFAULT_SECTIONS]);
  const flip = (s: SectionKey, on: boolean) => setSections((cur) => (on ? [...cur, s] : cur.filter((x) => x !== s)));
  return (
    <>
      <Body style={{ marginTop: 8 }}>
        {a.inApp ? `Journal and ask inside Attune, and use ${a.name} itself with your record.` : `Connect from ${a.name} through Attune's connector, then journal or ask there.`}
      </Body>
      <Small style={{ marginTop: 4 }}>Pick what {a.name} may read. You can change it any time.</Small>
      <div style={{ marginTop: 6 }}>
        {ASSISTANT_SECTIONS.map((s) => (
          <Toggle key={s} id={`new-${a.id}-${s}`} on={sections.includes(s)} label={SECTION[s].label} detail={SECTION[s].detail} onChange={(on) => flip(s, on)} />
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <Button full onClick={() => run({ ...ME, type: "connectAssistant", patientId: patient.id, assistantId: a.id, sections, token: newToken() }, `${a.name} connected.`)}>
          Connect {a.name}
        </Button>
      </div>
    </>
  );
}

function Connected({ a, w, patient, run, since, token }: { a: AssistantInfo; w: World; patient: Patient; run: Run; since: string; token: string }) {
  const on = ASSISTANT_SECTIONS.filter((s) => canSee(w, patient.id, a.id, s)).length;
  return (
    <>
      <Small style={{ marginTop: 4 }}>Connected since {dateShort(since)} · {on} of {ASSISTANT_SECTIONS.length} parts shared</Small>
      <div style={{ marginTop: 6 }}>
        {ASSISTANT_SECTIONS.map((s) => (
          <Toggle
            key={s}
            id={`${a.id}-${s}`}
            on={canSee(w, patient.id, a.id, s)}
            label={SECTION[s].label}
            detail={SECTION[s].detail}
            onChange={(next) => run({ ...ME, type: "setConsent", patientId: patient.id, recipientId: a.id, section: s, on: next }, next ? `${a.name} can read this now.` : `${a.name} can no longer read this.`)}
          />
        ))}
      </div>
      <ConnectorBox url={connectorUrl(token)} />
      <div style={{ marginTop: 8 }}>
        <Button full variant="quiet" onClick={() => run({ ...ME, type: "disconnectAssistant", patientId: patient.id, assistantId: a.id }, `${a.name} disconnected. Its connector address no longer works.`)}>
          Disconnect {a.name}
        </Button>
      </div>
    </>
  );
}

export function Assistants({ w, patient }: { w: World; patient: Patient }) {
  const [toast, show] = useToast();
  const run = useAct(show);
  const status = useGatewayStatus();

  return (
    <Screen back="/care" overline="AI assistants" title="Bring your own AI" sub="Journal in Claude or ChatGPT and keep your record current. They read only what you switch on.">
      <Notice>Assistants draft; you decide. Nothing they suggest changes your record until you apply it, and every read shows under “Who viewed your record”.</Notice>
      {AI_ASSISTANTS.map((a, i) => {
        const link = activeLink(w, patient.id, a.id);
        return (
          <Paper key={a.id} seed={81 + i} torn={false}>
            <Overline>{a.vendor}</Overline>
            <Voice as="h2" size={SIZE.xl} style={{ marginTop: 6 }}>{a.name}</Voice>
            {a.inApp && <div style={{ marginTop: 6 }}><InAppStatus status={status} /></div>}
            {link ? <Connected a={a} w={w} patient={patient} run={run} since={link.connectedAt} token={link.token} /> : <NotConnected a={a} patient={patient} run={run} />}
          </Paper>
        );
      })}
      <SectionLabel>What an assistant can't do</SectionLabel>
      <Paper seed={89} torn={false}>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: SIZE.body, lineHeight: 1.7, color: T.forest, listStyle: "disc" }}>
          <li>Diagnose you or name a condition</li>
          <li>Say what a result means for your health</li>
          <li>Recommend or change treatment, supplements or doses</li>
          <li>Change your record without you</li>
        </ul>
        <Small style={{ marginTop: 8 }}>For any of those, ask your care team.</Small>
      </Paper>
      {toast}
    </Screen>
  );
}
