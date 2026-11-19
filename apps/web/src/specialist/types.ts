import type { Practice, Role, World } from "@attune/domain";
import type { Run } from "../pcp/types";

/** What every specialist page gets: the world, the demo clock, the practice in view and its front desk. */
export interface DeskProps {
  w: World;
  now: string;
  practice: Practice;
  desk: { by: Extract<Role, "specialist_staff">; who: string };
  run: Run;
}
