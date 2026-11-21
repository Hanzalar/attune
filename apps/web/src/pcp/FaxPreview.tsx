import { DEMO_IDS, PACK_SECTIONS, SECTION_STAFF, SPECIALTY, canSee, type Patient, type Referral, type World } from "@attune/domain";
import { RADIUS, SIZE, T } from "../design/tokens";
import { dateShort } from "../shared/format";
import { Notice, Overline, Rows } from "../shared/ui";

/** The packet that would go to a practice not on Attune. A preview only: the prototype transmits nothing. */
export function FaxPreview({ w, patient, referral, practiceId }: { w: World; patient: Patient; referral: Referral; practiceId: string }) {
  const to = w.practices.find((p) => p.id === practiceId);
  const from = w.practices.find((p) => p.id === DEMO_IDS.pcp);
  if (!to || !from) return null;
  const fax = to.routes.fax;
  const route = to.routes.direct
    ? `Direct (360X): ${to.routes.direct}`
    : fax
      ? `E-fax: ${fax.number} · ${fax.verified ? "verified" : "not verified, fix the directory first"}`
      : "No route on file";
  const enclosed = PACK_SECTIONS.filter((s) => canSee(w, patient.id, DEMO_IDS.pcp, s)).map((s) => SECTION_STAFF[s]);

  return (
    <div className="flex flex-col gap-2">
      <div className="paper" style={{ border: `1px solid ${T.hairline}`, borderRadius: RADIUS.sm, padding: 12 }}>
        <Overline style={{ fontSize: SIZE.xs }}>Cover sheet · referral</Overline>
        <div style={{ marginTop: 8 }}>
          <Rows
            rows={[
              ["To", `${to.name}${to.providers[0] ? `, attn. ${to.providers[0]}` : ""}`],
              ["Route", route],
              ["From", `${from.name} · fax ${from.routes.fax?.number ?? "—"}`],
              ["Re", `Referral to ${SPECIALTY[referral.specialty].label}: ${patient.name}, DOB ${dateShort(patient.dob)}`],
              ["Reason", referral.reason || "Write the reason above."],
              ["Enclosed", ["PCP referral note", ...enclosed].join(" · ")],
            ]}
          />
        </div>
      </div>
      <Notice tone="attention" title="Not transmitted in the prototype">
        A real send would first ask her to approve sharing with this practice, then go by verified e-fax or Direct. She would not join the Attune waitlist.
      </Notice>
    </div>
  );
}
