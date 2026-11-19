/**
 * Share with my doctor: she picks the parts, gets a one-time code and a QR code. The office also needs her date of
 * birth, so a code read over someone's shoulder isn't enough on its own.
 */
import { useMemo, useState } from "react";
import qrcode from "qrcode-generator";
import { ALL_SECTIONS, SECTION, makeShareCode, nameOf, type Patient, type SectionKey, type World } from "@attune/domain";
import { RADIUS, SIZE, T } from "../design/tokens";
import { viewUrl } from "../shared/store";
import { Button, Notice, Overline, Paper, Toggle, Voice, formatLeft, useAct, useToast } from "../shared/ui";
import { ME, go } from "./nav";
import { Body, Screen, Small } from "./Screen";

function Qr({ text }: { text: string }) {
  const { d, size } = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    let path = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) path += `M${c + 4} ${r + 4}h1v1h-1z`;
    return { d: path, size: n + 8 };
  }, [text]);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: 220, display: "block", margin: "0 auto", background: T.cream, borderRadius: RADIUS.sm }} role="img" aria-label="QR code that opens your shared record at the office" shapeRendering="crispEdges">
      <path d={d} fill={T.forest} />
    </svg>
  );
}

export function Share({ w, patient, now }: { w: World; patient: Patient; now: string }) {
  const [toast, show] = useToast();
  const run = useAct(show);
  const [sections, setSections] = useState<SectionKey[]>([...ALL_SECTIONS]);
  const [made, setMade] = useState<string | null>(null);
  const code = made ? w.shareCodes.filter((c) => c.code === made && c.patientId === patient.id).at(-1) : undefined;

  const create = () => {
    // Codes derive from the code count, so the one this command creates is known in advance.
    const next = makeShareCode(w.shareCodes.length);
    if (run({ ...ME, type: "createShareCode", patientId: patient.id, sections })) setMade(next);
  };

  if (code) {
    const left = Date.parse(code.expiresAt) - Date.parse(now);
    const link = `${window.location.origin}${viewUrl("pcp", `lookup/${code.code}`)}`;
    return (
      <Screen overline="Share with my doctor" title="Show this at the front desk">
        {code.redeemedBy ? (
          <Notice tone="done" title={`${nameOf(w, code.redeemedBy)} opened your record`}>
            They can see the parts you picked. Change that any time in Care team.
          </Notice>
        ) : left <= 0 ? (
          <Notice tone="attention" title="This code expired">Codes work once, for a short time. Make a new one when you're at the desk.</Notice>
        ) : null}
        <Paper seed={61}>
          <Overline>Your code</Overline>
          <p className="tnum" style={{ fontSize: SIZE.xxl, fontWeight: 600, letterSpacing: "0.12em", color: T.forest, margin: "8px 0 14px", textAlign: "center" }}>{code.code}</p>
          <Qr text={link} />
          <Body style={{ marginTop: 14, textAlign: "center" }}>The office will also ask for your date of birth.</Body>
          {!code.redeemedBy && left > 0 && (
            <Small style={{ textAlign: "center", marginTop: 6 }}>
              Works once · expires in <span className="tnum">{formatLeft(left)}</span>
            </Small>
          )}
        </Paper>
        <Paper seed={62} torn={false}>
          <Overline>What it shares</Overline>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: SIZE.body, lineHeight: 1.6 }}>
            {code.sections.map((s) => <li key={s}>{SECTION[s].label}</li>)}
          </ul>
        </Paper>
        <Small>Demo: the QR link opens the PCP portal in this browser only.</Small>
        <Button full variant="secondary" onClick={() => setMade(null)}>Make a different code</Button>
        <Button full onClick={() => go(code.redeemedBy ? "/care" : "/")}>{code.redeemedBy ? "See your care team" : "Done"}</Button>
        {toast}
      </Screen>
    );
  }

  return (
    <Screen overline="Share with my doctor" title="Pick what they see" sub="Your primary care office reads it on one page. You can change this later, part by part.">
      <Paper seed={63} torn={false}>
        {ALL_SECTIONS.map((s) => (
          <Toggle
            key={s}
            id={`share-${s}`}
            on={sections.includes(s)}
            label={SECTION[s].label}
            detail={SECTION[s].detail}
            onChange={(on) => setSections((prev) => (on ? ALL_SECTIONS.filter((x) => prev.includes(x) || x === s) : prev.filter((x) => x !== s)))}
          />
        ))}
      </Paper>
      <Button full onClick={create} disabled={sections.length === 0}>Make my share code</Button>
      {sections.length === 0 && <Small style={{ textAlign: "center" }}>Pick at least one part to share.</Small>}
      <Voice as="p" size={SIZE.lg} color={T.raspberry} style={{ textAlign: "center" }}>only what you pick leaves your record.</Voice>
      {toast}
    </Screen>
  );
}
