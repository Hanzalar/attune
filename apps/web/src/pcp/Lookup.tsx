import { useState } from "react";
import { ArrowRight, KeyRound } from "lucide-react";
import { DEMO_IDS, SHARE_CODE_MINUTES, normalizeCode, visibleSections, type World } from "@attune/domain";
import { SIZE, T } from "../design/tokens";
import { ago, dateShort } from "../shared/format";
import { Button, Empty, Field, Notice, Panel, inputStyle, td, th } from "../shared/ui";
import { PageTitle, go } from "../shared/Clinic";
import type { Actor, Run } from "./types";

/** Patient lookup: she reads out (or shows) her share code; the MA adds her date of birth to open the record. */
export function Lookup({ w, now, actor, run, prefill }: { w: World; now: string; actor: Actor; run: Run; prefill: string }) {
  const [code, setCode] = useState(prefill);
  const [dob, setDob] = useState("");
  const pcp = DEMO_IDS.pcp;

  const open = () => {
    const match = w.shareCodes.find((s) => s.code === normalizeCode(code));
    const ok = run({ ...actor, type: "redeemShareCode", code, dob, practiceId: pcp }, "Record opened. The patient can see that you did.");
    if (ok && match) go(`patient/${match.patientId}`);
  };

  const sharing = [...new Set(w.consents.filter((c) => c.recipientId === pcp && c.revokedAt === null).map((c) => c.patientId))]
    .map((id) => w.patients.find((p) => p.id === id))
    .filter((p) => p !== undefined);

  return (
    <>
      <PageTitle over="Patients" title="Find a patient's record" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
        <Panel title="Open with a share code" meta={`Codes work once, for ${SHARE_CODE_MINUTES} minutes`}>
          <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); open(); }}>
            <Field label="Share code" htmlFor="code" hint="From her app: Share with my doctor. Scanning her QR fills this in.">
              <input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABC-234" autoComplete="off" spellCheck={false} className="tnum" style={{ ...inputStyle, letterSpacing: "0.12em", textTransform: "uppercase" }} />
            </Field>
            <Field label="Date of birth" htmlFor="dob" hint="Must match her record, as with portal share codes.">
              <input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} style={inputStyle} />
            </Field>
            <Button type="submit" size="md" icon={<KeyRound size={16} aria-hidden />}>Open her record</Button>
          </form>
          <div style={{ marginTop: 12 }}>
            <Notice>Only the sections she picked open. Every view is logged and shown to her.</Notice>
          </div>
        </Panel>

        <Panel title="Sharing with your practice" meta={`${sharing.length} patients`} pad={false}>
          {sharing.length === 0 ? (
            <div style={{ padding: 16 }}><Empty>Nobody shares a record with you yet.</Empty></div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 520 }}>
                <thead>
                  <tr><th style={th}>Patient</th><th style={th}>DOB</th><th style={th}>Sections shared</th><th style={th}>Last viewed here</th><th style={th} aria-label="Open record" /></tr>
                </thead>
                <tbody>
                  {sharing.map((p) => {
                    const lastView = w.views.filter((v) => v.patientId === p.id && v.recipientId === pcp).at(-1);
                    return (
                      <tr key={p.id}>
                        <td style={td}><strong>{p.name}</strong> <span className="tnum" style={{ color: T.inkMuted }}>{p.ref}</span></td>
                        <td style={td} className="tnum">{dateShort(p.dob)}</td>
                        <td style={td}>{visibleSections(w, p.id, pcp).length} of 6</td>
                        <td style={{ ...td, color: T.inkMuted }}>{lastView ? `${ago(lastView.at, now)} by ${lastView.viewer}` : "Not yet"}</td>
                        <td style={td}>
                          <a href={`#/patient/${p.id}`} className="inline-flex items-center gap-1" style={{ color: T.raspberry, fontWeight: 600, fontSize: SIZE.sm, minHeight: 32 }}>
                            Open <ArrowRight size={14} aria-hidden />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
