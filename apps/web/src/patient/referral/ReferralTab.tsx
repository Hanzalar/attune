import type { Referral } from "@attune/domain";
import { Booking } from "./Booking";
import { Status } from "./Status";

/** Before approval the patient books; after, they track. The stage decides, not a local flag. */
export function ReferralTab(props: { r: Referral; show: (m: string, e?: boolean) => void; openDossier: () => void }) {
  return props.r.stage === "draft" ? <Booking {...props} /> : <Status {...props} />;
}
