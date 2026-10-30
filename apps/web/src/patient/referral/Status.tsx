import { CalendarCheck, Eye, Hourglass, Undo2 } from "lucide-react";
import { DEMO_SHARE_ITEMS, DEMO_SPECIALISTS, type Referral } from "@attune/domain";
import { SIZE, T } from "../../design/tokens";
import { StageList, useAct } from "../../shared/loop";
import { Button, Card, Label, Notice, StatusPill, type StatusTone } from "../../shared/ui";
import { PageTitle } from "../Tracker";
import { slotLong } from "./ProviderCard";

interface View { tone: StatusTone; pill: string; text: string }

function describe(r: Referral, office: string): View {
  switch (r.stage) {
    case "awaiting_pcp":
      return { tone: "warning", pill: "Waiting on your PCP's office", text: `Your ${r.requestedSlot ? "time is held" : "request is ready"}. Your PCP's office checks the packet and signs next.` };
    case "awaiting_physician":
      return { tone: "warning", pill: "Waiting on your doctor's signature", text: "The medical assistant signed. Your plan also needs your doctor's signature." };
    case "signed":
    case "sent":
      return { tone: "info", pill: `With ${office}`, text: r.requestedSlot ? "They'll confirm your held time or offer another one." : "They'll offer you a time." };
    case "offered":
      return { tone: "warning", pill: "New time offered", text: r.requestedSlot ? "Your requested time wasn't available, so the office offered another." : "The office offered you a time." };
    case "booked":
      return { tone: "success", pill: "Booked", text: "Your summary is already with the office, so you'll spend less of the visit retelling your history." };
    case "visited":
    case "closed":
      return { tone: "success", pill: "Visit done", text: "Your PCP's office has the update, so both offices stay in the loop." };
    case "declined":
      return { tone: "danger", pill: "Not accepted", text: `The office explained why: ${r.note ?? ""}` };
    case "withdrawn":
      return { tone: "neutral", pill: "Sharing stopped", text: "Nothing further is shared. The office keeps what it already received." };
    case "draft":
      return { tone: "neutral", pill: "Not sent", text: "" };
  }
}

/** After sending: one appointment card, the action that is the patient's (if any), progress, and stop sharing. */
export function Status({ r, show, openDossier }: { r: Referral; show: (m: string, e?: boolean) => void; openDossier: () => void }) {
  const run = useAct(show);
  const doc = DEMO_SPECIALISTS.find((s) => s.id === r.specialistId);
  const v = describe(r, doc?.practice ?? "the office");
  const slot = r.bookedSlot ?? r.offeredSlot ?? r.requestedSlot;
  const finished = ["closed", "declined", "withdrawn"].includes(r.stage);
  const consentActive = r.consent.grantedAt !== null && r.consent.revokedAt === null && !finished;
  const beforeSend = ["awaiting_pcp", "awaiting_physician", "signed"].includes(r.stage);
  const shared = DEMO_SHARE_ITEMS.filter((i) => r.share[i.key]);

  return (
    <div className="flex flex-col gap-4">
      <PageTitle title="Your referral" />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2"><Label>Appointment</Label><StatusPill tone={v.tone}>{v.pill}</StatusPill></div>
        {doc && <p style={{ fontSize: SIZE.md, fontWeight: 600, color: T.text, marginTop: 10 }}>{doc.name}</p>}
        {doc && <p style={{ fontSize: SIZE.sm, color: T.textMuted }}>{doc.practice} · {doc.miles.toFixed(1)} mi</p>}
        <p className="flex items-center gap-2 mt-3" style={{ fontSize: SIZE.body, color: T.text, fontWeight: 600 }}>
          {r.stage === "booked" || r.stage === "visited" || r.stage === "closed" ? <CalendarCheck size={18} color={T.success} aria-hidden /> : <Hourglass size={18} color={T.textMuted} aria-hidden />}
          {slot ? slotLong(slot) : "Waitlist · next opening"}
          {slot && slot === r.requestedSlot && r.stage !== "booked" && !finished && <span style={{ fontSize: SIZE.sm, color: T.textMuted, fontWeight: 500 }}>(held)</span>}
        </p>
        <p style={{ fontSize: SIZE.body - 1, color: T.textMuted, marginTop: 8 }}>{v.text}</p>
        {r.stage === "offered" && r.offeredSlot && (
          <div className="mt-4"><Button kind="primary" size="lg" full onClick={() => run({ type: "bookSlot", by: "patient" }, "Booked. Your summary is with the office")}>Book {slotLong(r.offeredSlot)}</Button></div>
        )}
        {r.stage === "booked" && (
          <div className="mt-4"><Button kind="primary" size="lg" full onClick={() => run({ type: "completeVisit", by: "patient", outcome: "Patient reported the visit happened." }, "Thanks. Your PCP's office has the update")}>I had my visit</Button></div>
        )}
      </Card>

      {r.openRequests.length > 0 && <Notice tone="warning" title="The office asked for more records">{r.openRequests.join("; ")}</Notice>}

      <Card>
        <Label>Progress</Label>
        <div className="mt-3"><StageList r={r} /></div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>Shared with your OK</Label>
          <Button kind="quiet" onClick={openDossier}><Eye size={15} aria-hidden /> Preview</Button>
        </div>
        <ul className="mt-2 flex flex-col gap-1" style={{ fontSize: SIZE.body - 1, color: T.text, listStyle: "disc", paddingLeft: 20 }}>
          {shared.map((i) => <li key={i.key}>{i.title}</li>)}
        </ul>
      </Card>

      {consentActive && (
        <Card>
          <p style={{ fontSize: SIZE.body - 1, color: T.text, fontWeight: 600 }}>Changed your mind?</p>
          <p style={{ fontSize: SIZE.sm, color: T.textMuted, marginTop: 2 }}>
            {beforeSend ? "Nothing has gone to the gynecologist yet. Stopping pulls the request back from your PCP's office." : "The office keeps what it already received. Nothing more will be shared."}
          </p>
          <div className="mt-3">
            <Button kind="secondary" onClick={() => run({ type: "revokeConsent", by: "patient" }, beforeSend ? "Request pulled back. Nothing was sent" : "Sharing stopped")}>
              <Undo2 size={16} aria-hidden /> {beforeSend ? "Stop sharing and pull it back" : "Stop sharing"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
