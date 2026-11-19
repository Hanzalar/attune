import { useEffect } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { PACK_SECTIONS, canSee } from "@attune/domain";
import { SIZE, T } from "../design/tokens";
import { PatientPack } from "../shared/PatientPack";
import { act } from "../shared/store";
import { Notice, Panel } from "../shared/ui";
import type { DeskProps } from "./types";

/** Her Patient Pack, only while she shares it with this office. Opening it logs a view she can see. */
export function Pack({ w, now, practice, desk, referralId, show }: DeskProps & { referralId: string; show: (m: string, e?: boolean) => void }) {
  const referral = w.referrals.find((r) => r.id === referralId);
  const slot = referral?.slotId ? w.slots.find((s) => s.id === referral.slotId) : undefined;
  const visible = referral ? PACK_SECTIONS.filter((s) => canSee(w, referral.patientId, practice.id, s)) : [];
  const visibleKey = visible.join(",");
  const patientId = referral?.patientId;
  const { by, who } = desk;

  useEffect(() => {
    if (!patientId || !visibleKey) return;
    const err = act({ by, who, type: "viewRecord", patientId, recipientId: practice.id, sections: visible });
    if (err) show(err, true);
  }, [patientId, visibleKey, practice.id, by, who, show]); // `visible` is captured through `visibleKey`.

  const back = (
    <a href="#/openings" className="no-print inline-flex items-center gap-1" style={{ color: T.raspberry, fontWeight: 600, fontSize: SIZE.sm, margin: "16px 0", minHeight: 32 }}>
      <ArrowLeft size={14} aria-hidden /> All openings
    </a>
  );

  if (!referral || visible.length === 0 || slot?.practiceId !== practice.id) {
    return (
      <>
        {back}
        <Notice tone="attention" title="She hasn't shared her Pack with your office">
          <span className="inline-flex items-start gap-1.5"><Lock size={14} aria-hidden style={{ marginTop: 2 }} />A Patient Pack opens only after she accepts one of your openings, and only while she keeps sharing it.</span>
        </Notice>
      </>
    );
  }

  return (
    <>
      {back}
      <Panel>
        <PatientPack w={w} patientId={referral.patientId} viewerId={practice.id} referral={referral} slot={slot} now={now} exportable />
      </Panel>
    </>
  );
}
