/**
 * Home: the one patient home screen. A live offer first (it's time-critical), then the journal composer (the main
 * way in), then her referral, today's check-in and any new summary, and then it ends. One finite page: no feed, no
 * badges, no red dots.
 */
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import {
  DEMO_TZ, MODE, REFERRAL_STATUS, SPECIALTY, nameOf, patientHome, type Patient, type PatientHome, type World,
} from "@attune/domain";
import { SIZE, T } from "../design/tokens";
import { daysWaiting, when } from "../shared/format";
import { Button, Countdown, Ink, Notice, Overline, Paper, StatusPill, Voice, useAct, useToast } from "../shared/ui";
import { Composer } from "./Composer";
import { ME, PATIENT_ID, dayNumber, go, greeting, weekdayName } from "./nav";
import { Body, Screen, Small } from "./Screen";

function Card({ overline, title, children, seed }: { overline: string; title?: ReactNode; children: ReactNode; seed: number }) {
  return (
    <Paper seed={seed} className="rise">
      <Overline>{overline}</Overline>
      {title && <Voice as="h2" size={SIZE.xl} style={{ marginTop: 8 }}>{title}</Voice>}
      <div className="flex flex-col gap-3" style={{ marginTop: 10 }}>{children}</div>
    </Paper>
  );
}

function OfferCard({ h, now, onAccept }: { h: NonNullable<PatientHome["offer"]>; now: string; onAccept: () => void }) {
  const total = Date.parse(h.offer.expiresAt) - Date.parse(h.offer.sentAt);
  return (
    <Card overline="A time opened up for you" title={when(h.slot.startsAt, h.practice.timeZone)} seed={3}>
      <Body>{h.slot.provider} · {h.practice.name} · {MODE[h.slot.mode]}</Body>
      <Countdown msLeft={Date.parse(h.offer.expiresAt) - Date.parse(now)} totalMs={total} />
      <Small>Accepting shares your Patient Pack with {h.practice.name}. They see nothing about you before then.</Small>
      <div className="flex flex-col gap-2">
        <Button full onClick={onAccept}>Accept this time</Button>
        <Button full variant="secondary" onClick={() => go(`/offer/${h.offer.id}`)}>See details</Button>
      </div>
    </Card>
  );
}

function ReferralCard({ w, h, patient, now }: { w: World; h: PatientHome; patient: Patient; now: string }) {
  const r = h.referral;
  const sharesWithPcp = w.consents.some((c) => c.patientId === PATIENT_ID && c.recipientId === patient.pcpId && c.revokedAt === null);
  if (!r) {
    return (
      <Card overline="Your referral" title={sharesWithPcp ? "Nothing yet" : "Start with your doctor"} seed={4}>
        <Body>
          {sharesWithPcp
            ? `${nameOf(w, patient.pcpId)} can see your record. When they refer you, it shows up here.`
            : "Share your record with your primary care office. They decide on a referral; we take it from there."}
        </Body>
        {!sharesWithPcp && <Button full onClick={() => go("/share")}>Share with my doctor</Button>}
      </Card>
    );
  }
  const status = REFERRAL_STATUS[r.status];
  const action: { label: string; to: string } | null =
    r.status === "insurance_pending" ? { label: "Add your insurance card", to: "/insurance" }
    : r.status === "insurance_issue" ? { label: "Retake your card photo", to: "/insurance" }
    : r.status === "on_waitlist" ? { label: "Waitlist preferences", to: "/waitlist" }
    : r.status === "booked" && h.booked ? { label: h.booked.canConfirm ? "Confirm your visit" : "See your visit", to: "/booked" }
    : null;
  return (
    <Card overline={`Referral to ${SPECIALTY[r.specialty].label}`} seed={5}>
      <div><StatusPill tone={status.tone} label={status.label} /></div>
      <Body>{status.patient}</Body>
      {r.status === "insurance_issue" && patient.insurance?.issue && <Notice tone="issue">{patient.insurance.issue}</Notice>}
      {r.status === "on_waitlist" && (
        <Small>
          On the list for {daysWaiting(r.waitlistSince, now)}. {patient.prefs.paused ? "Paused: no offers until you turn it back on." : "We never promise a date or a place in line."}
        </Small>
      )}
      {r.status === "booked" && h.booked && <Body style={{ fontWeight: 600 }}>{when(h.booked.slot.startsAt, h.booked.practice.timeZone)} · {h.booked.practice.name}</Body>}
      {action && <Button full variant={r.status === "on_waitlist" ? "secondary" : "primary"} onClick={() => go(action.to)}>{action.label}</Button>}
    </Card>
  );
}

export function Home({ w, patient, now }: { w: World; patient: Patient; now: string }) {
  const [toast, show] = useToast();
  const run = useAct(show);
  const h = patientHome(w, PATIENT_ID, now, DEMO_TZ);
  const showSummary = h.summary && (h.referral?.status === "closed" || h.referral?.status === "summary_received");

  const accept = () => {
    if (h.offer && run({ ...ME, type: "acceptOffer", offerId: h.offer.offer.id })) go("/booked");
  };

  return (
    <Screen
      bloom
      back={null}
      overline={`${weekdayName(now)} · Day ${dayNumber(patient.onboardedAt, now)}`}
      title={`${greeting(now)}, ${patient.firstName}.`}
      foot={
        <div className="flex flex-col items-center gap-1" style={{ textAlign: "center" }}>
          <Ink style={{ fontSize: SIZE.xl }}>you're caught up.</Ink>
          <Body muted>See you tomorrow.</Body>
        </div>
      }
    >
      {h.offer && <OfferCard h={h.offer} now={now} onAccept={accept} />}
      <Composer w={w} onHome />
      <ReferralCard w={w} h={h} patient={patient} now={now} />
      {!h.checkedInToday ? (
        <Card overline="Check-in · about a minute" title="How are you, really?" seed={6}>
          <Body muted>Mood, sleep, energy, skin. Private to you unless you share it.</Body>
          <Button full onClick={() => go("/checkin")}>Start today's check-in</Button>
        </Card>
      ) : (
        <a href="#/checkin" className="flex items-center justify-between" style={{ minHeight: 44, fontSize: SIZE.body, color: T.forest, padding: "4px 2px" }}>
          <span>Checked in today{h.streak > 1 ? ` · ${h.streak} days in a row` : ""}</span>
          <ArrowRight size={18} aria-hidden />
        </a>
      )}
      {showSummary && h.summary && (
        <Card overline="After your visit" title="Your summary arrived" seed={8}>
          <Body muted>From {nameOf(w, h.summary.practiceId)}. It's in your record now.</Body>
          <Button full variant="secondary" onClick={() => go("/summary")}>Read your visit summary</Button>
        </Card>
      )}
      {toast}
    </Screen>
  );
}
