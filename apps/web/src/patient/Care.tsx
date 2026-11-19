/**
 * Care team: everyone she shares with, and a switch per section per office. Turning one off stops future sharing;
 * we say plainly that an office may keep what it already received.
 */
import { AI_ASSISTANTS, ALL_SECTIONS, ASSISTANT_SECTIONS, SECTION, SPECIALTY, activeLink, canSee, recipientsOf, type Patient, type World } from "@attune/domain";
import { SIZE, T } from "../design/tokens";
import { dateShort } from "../shared/format";
import { Button, Notice, Overline, Paper, Toggle, Voice, useAct, useToast } from "../shared/ui";
import { ME, go } from "./nav";
import { Body, Screen, Small } from "./Screen";

export function Care({ w, patient }: { w: World; patient: Patient }) {
  const [toast, show] = useToast();
  const run = useAct(show);
  const recipients = recipientsOf(w, patient.id);

  return (
    <Screen overline="Care team" title="Who sees what" sub="Your doctors see only the parts you switch on. Every change is logged.">
      <Notice>Turning a section off stops future sharing. The office may keep what it already received.</Notice>
      <Paper seed={50} torn={false}>
        <Overline>AI assistants</Overline>
        {AI_ASSISTANTS.some((a) => activeLink(w, patient.id, a.id)) ? (
          <ul className="flex flex-col gap-1" style={{ listStyle: "none", margin: "8px 0 0", padding: 0 }}>
            {AI_ASSISTANTS.filter((a) => activeLink(w, patient.id, a.id)).map((a) => (
              <li key={a.id}>
                <Body><strong>{a.name}</strong> <span style={{ color: T.inkMuted }}>({a.vendor})</span></Body>
                <Small>{ASSISTANT_SECTIONS.filter((s) => canSee(w, patient.id, a.id, s)).length} of {ASSISTANT_SECTIONS.length} parts shared</Small>
              </li>
            ))}
          </ul>
        ) : (
          <Body style={{ marginTop: 8 }}>Journal and ask with Claude or ChatGPT. They read only what you switch on.</Body>
        )}
        <div style={{ marginTop: 12 }}>
          <Button full variant="secondary" onClick={() => go("/assistants")}>
            {AI_ASSISTANTS.some((a) => activeLink(w, patient.id, a.id)) ? "Manage assistants" : "Connect Claude or ChatGPT"}
          </Button>
        </div>
      </Paper>
      {recipients.length === 0 && (
        <Paper seed={51}>
          <Body>You aren't sharing with anyone yet.</Body>
        </Paper>
      )}
      {recipients.map((id, i) => {
        const practice = w.practices.find((p) => p.id === id);
        if (!practice) return null;
        const first = w.consents.filter((c) => c.patientId === patient.id && c.recipientId === id).map((c) => c.grantedAt).sort()[0];
        const role = practice.kind === "pcp" ? "Your primary care office" : practice.specialty ? `${SPECIALTY[practice.specialty].label} office` : "Specialist office";
        const on = ALL_SECTIONS.filter((s) => canSee(w, patient.id, id, s)).length;
        return (
          <Paper key={id} seed={52 + i} torn={false}>
            <Overline>{role}</Overline>
            <Voice as="h2" size={SIZE.xl} style={{ marginTop: 6 }}>{practice.name}</Voice>
            <Small style={{ marginTop: 4 }}>
              Sharing since {first ? dateShort(first) : "—"} · {on} of {ALL_SECTIONS.length} parts on
            </Small>
            <div style={{ marginTop: 8 }}>
              {ALL_SECTIONS.map((s) => (
                <Toggle
                  key={s}
                  id={`${id}-${s}`}
                  on={canSee(w, patient.id, id, s)}
                  label={SECTION[s].label}
                  detail={SECTION[s].detail}
                  onChange={(next) =>
                    run({ ...ME, type: "setConsent", patientId: patient.id, recipientId: id, section: s, on: next }, next ? `Shared with ${practice.name}.` : `Stopped sharing with ${practice.name}.`)
                  }
                />
              ))}
            </div>
          </Paper>
        );
      })}
      <Button full variant="secondary" onClick={() => go("/share")}>Share with another doctor</Button>
      <p style={{ fontSize: SIZE.sm, color: T.inkMuted, margin: 0 }}>
        Specialists get your Patient Pack only when you accept a visit time with them.
      </p>
      {toast}
    </Screen>
  );
}
