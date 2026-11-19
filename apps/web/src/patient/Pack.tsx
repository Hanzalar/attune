/**
 * Her view of the Patient Pack, exactly as an office would see it, and the after-visit summary once it lands.
 */
import { currentReferral, nameOf, type Patient, type World } from "@attune/domain";
import { dateShort } from "../shared/format";
import { PatientPack } from "../shared/PatientPack";
import { Button, Ink, Notice, Overline, Paper } from "../shared/ui";
import { go } from "./nav";
import { Body, Screen, Small } from "./Screen";

export function Pack({ w, patient, now }: { w: World; patient: Patient; now: string }) {
  const referral = currentReferral(w, patient.id) ?? null;
  const slot = referral?.slotId ? w.slots.find((s) => s.id === referral.slotId) ?? null : null;
  return (
    <Screen overline="Patient Pack" title="One page, your story once" sub="When you accept a visit time, this is what that office receives. Nothing before then.">
      <Paper seed={91} torn={false} style={{ padding: "18px 16px" }}>
        <PatientPack w={w} patientId={patient.id} viewerId={null} referral={referral} slot={slot} now={now} />
      </Paper>
      <Small>Want to leave something out? Turn that part off for the office in Care team. They may keep what they already received.</Small>
      <Button full variant="secondary" onClick={() => go("/care")}>Open Care team</Button>
    </Screen>
  );
}

export function Summary({ w, patient }: { w: World; patient: Patient }) {
  const summaries = w.summaries
    .filter((s) => w.referrals.some((r) => r.id === s.referralId && r.patientId === patient.id))
    .sort((a, b) => b.at.localeCompare(a.at));
  const s = summaries[0];
  if (!s) {
    return (
      <Screen overline="After your visit" title="No summary yet">
        <Paper seed={92}><Body>After a specialist visit, the office sends a summary here. Your PCP gets a copy if you share summaries with them.</Body></Paper>
        <Button full onClick={() => go("/")}>Back to home</Button>
      </Screen>
    );
  }
  const referral = w.referrals.find((r) => r.id === s.referralId);
  const delivered = w.log.find((e) => e.type === "closeLoop" && e.patientId === patient.id && e.at >= s.at);
  const toPcp = delivered?.shared?.recipientId === referral?.pcpId;
  return (
    <Screen overline="After your visit" title="Your visit summary" sub={`From ${nameOf(w, s.practiceId)}, ${dateShort(s.at)}`}>
      <Paper seed={93}>
        <Overline>In their words</Overline>
        <Body style={{ marginTop: 10, lineHeight: 1.6 }}>{s.text}</Body>
        {s.followUp && (
          <>
            <Overline style={{ marginTop: 16 }}>Follow-up</Overline>
            <Body style={{ marginTop: 8 }}>{s.followUp}</Body>
          </>
        )}
        <Small style={{ marginTop: 14 }}>Written by {s.author}. {s.backToPcp ? "Ongoing care goes back to your PCP." : "The specialist office will keep seeing you."}</Small>
      </Paper>
      {referral && (
        <Notice tone={toPcp ? "done" : "neutral"} title={toPcp ? `${nameOf(w, referral.pcpId)} has it too` : "Kept to your record only"}>
          {toPcp ? "So nobody has to ask you to retell it." : "You weren't sharing visit summaries with your PCP, so we didn't send it. Turn that on in Care team if you want them to have it."}
        </Notice>
      )}
      <Ink style={{ textAlign: "center" }}>the loop is closed.</Ink>
      <Button full onClick={() => go("/")}>Back to home</Button>
    </Screen>
  );
}
