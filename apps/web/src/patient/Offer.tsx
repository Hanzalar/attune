/**
 * One offer, with its countdown and exactly what accepting shares. The "gone" states are designed first: in real
 * cancellation-fill systems most offers are opened after the slot is taken or the hold ended, so those screens are
 * calm, say she's still on the list, and never promise a date or a place in line.
 */
import { CalendarCheck, Clock, MapPin, Video } from "lucide-react";
import { MODE, PACK_SECTIONS, SECTION, milesBetween, type Patient, type World } from "@attune/domain";
import { SIZE, T } from "../design/tokens";
import { dayLong, clock } from "../shared/format";
import { Button, Countdown, Ink, Overline, Paper, Voice, useAct, useToast } from "../shared/ui";
import { ME, go } from "./nav";
import { Body, Screen, Small } from "./Screen";

function Gone({ title, line }: { title: string; line: string }) {
  return (
    <Screen overline="Visit offer" title={title}>
      <Paper seed={11}>
        <Body style={{ fontSize: SIZE.md }}>{line}</Body>
        <Ink style={{ marginTop: 12 }}>nothing you did wrong.</Ink>
        <Small style={{ marginTop: 12 }}>
          Openings come up when someone cancels. When the next one fits your days, times and distance, we'll hold it for you
          the same way. We never promise a date or a place in line.
        </Small>
      </Paper>
      <Button full variant="secondary" onClick={() => go("/waitlist")}>Check my waitlist preferences</Button>
      <Button full onClick={() => go("/")}>Back to home</Button>
    </Screen>
  );
}

export function Offer({ w, patient, id, now }: { w: World; patient: Patient; id: string; now: string }) {
  const [toast, show] = useToast();
  const run = useAct(show);
  const offer = w.offers.find((o) => o.id === id && o.patientId === patient.id);
  const slot = offer ? w.slots.find((s) => s.id === offer.slotId) : undefined;
  const practice = slot ? w.practices.find((p) => p.id === slot.practiceId) : undefined;

  if (!offer || !slot || !practice) return <Gone title="This offer isn't here" line="We couldn't find that offer. You're still on the list." />;
  const msLeft = Date.parse(offer.expiresAt) - Date.parse(now);
  if (offer.status === "accepted") {
    return (
      <Screen overline="Visit offer" title="You took this one">
        <Paper seed={12}><Body>You accepted this time. Your visit details are ready.</Body></Paper>
        <Button full onClick={() => go("/booked")}>See your visit</Button>
      </Screen>
    );
  }
  if (offer.status === "superseded" || (offer.status === "pending" && slot.status !== "offering")) {
    return <Gone title="That slot just filled" line="That slot just filled. You're still on the list." />;
  }
  if (offer.status === "expired" || (offer.status === "pending" && msLeft <= 0)) {
    return <Gone title="The hold ended" line="The hold ended. You're still on the list." />;
  }
  if (offer.status === "declined") {
    return <Gone title="You passed on this one" line="You said no to this time. You're still on the list." />;
  }

  const miles = slot.mode === "in_person" ? milesBetween(patient.home, practice.place) : null;
  const accept = () => {
    if (run({ ...ME, type: "acceptOffer", offerId: offer.id })) go("/booked");
  };
  const decline = () => {
    if (run({ ...ME, type: "declineOffer", offerId: offer.id }, "You're still on the list.")) go("/");
  };
  const row = { fontSize: SIZE.body, color: T.forest } as const;

  return (
    <Screen bloom overline="A time opened up" title={dayLong(slot.startsAt, practice.timeZone)} sub={`${clock(slot.startsAt, practice.timeZone)} · ${slot.minutes} minutes`}>
      <Paper seed={13}>
        <Countdown msLeft={msLeft} totalMs={Date.parse(offer.expiresAt) - Date.parse(offer.sentAt)} />
        <ul className="flex flex-col gap-2.5" style={{ listStyle: "none", padding: 0, margin: "16px 0 0" }}>
          <li className="flex items-start gap-2.5" style={row}><CalendarCheck size={18} aria-hidden style={{ marginTop: 2, flexShrink: 0 }} />{slot.provider}, {practice.name}</li>
          <li className="flex items-start gap-2.5" style={row}>
            {slot.mode === "telehealth" ? <Video size={18} aria-hidden style={{ marginTop: 2, flexShrink: 0 }} /> : <MapPin size={18} aria-hidden style={{ marginTop: 2, flexShrink: 0 }} />}
            {slot.mode === "telehealth" ? "Telehealth, from wherever you are" : `${MODE[slot.mode]} · ${practice.place.label} · about ${miles?.toFixed(1)} miles away`}
          </li>
          <li className="flex items-start gap-2.5" style={row}><Clock size={18} aria-hidden style={{ marginTop: 2, flexShrink: 0 }} />We're holding it for you until the timer runs out. Others may have it too; first to accept gets it.</li>
        </ul>
      </Paper>

      <Paper seed={14}>
        <Overline>What accepting shares</Overline>
        <Body style={{ marginTop: 8 }}>Tapping Accept shares your Patient Pack with {practice.name}. They see nothing about you before then.</Body>
        <ul style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: SIZE.body, lineHeight: 1.6, color: T.forest }}>
          {PACK_SECTIONS.map((s) => <li key={s}>{SECTION[s].label}</li>)}
          <li>Your PCP's referral note</li>
        </ul>
        <a href="#/pack" style={{ display: "inline-flex", minHeight: 44, alignItems: "center", fontSize: SIZE.body, color: T.raspberry, textDecoration: "underline", textUnderlineOffset: 3 }}>
          Preview your Patient Pack
        </a>
        <Small>You can turn sections off later in Care team. The office may keep what it already received.</Small>
      </Paper>

      <div className="flex flex-col gap-2">
        <Button full onClick={accept}>Accept this time</Button>
        <Button full variant="secondary" onClick={decline}>Not this one, keep me on the list</Button>
      </div>
      <Voice as="p" size={SIZE.lg} color={T.raspberry} style={{ textAlign: "center", marginTop: 4 }}>no pressure either way.</Voice>
      {toast}
    </Screen>
  );
}
