import { Paperclip } from "lucide-react";
import type { Patient, Referral, Result } from "@attune/domain";
import { SIZE, T } from "../design/tokens";
import { dateShort } from "../shared/format";
import { Button } from "../shared/ui";
import type { Actor, Run } from "./types";

/** "Attach from your EMR" buttons. The chart is mocked: there is no EMR connection in the prototype. */
export function AttachButtons({ results, referral, patient, actor, run }: { results: Result[]; referral: Referral; patient: Patient; actor: Actor; run: Run }) {
  if (results.length === 0) {
    return <p style={{ fontSize: SIZE.sm, color: T.inkMuted, margin: 0 }}>Nothing in your chart fills this. Order the test, or ask the patient to upload it.</p>;
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span style={{ fontSize: SIZE.xs, color: T.inkMuted }}>From your EMR (mocked):</span>
      {results.map((r) => (
        <Button
          key={r.name + r.collectedOn}
          size="sm"
          variant="secondary"
          icon={<Paperclip size={14} aria-hidden />}
          onClick={() => run({ ...actor, type: "attachResult", referralId: referral.id, result: r }, `${r.name} added to ${patient.firstName}'s record.`)}
        >
          Attach {r.name} ({dateShort(r.collectedOn)})
        </Button>
      ))}
    </div>
  );
}
