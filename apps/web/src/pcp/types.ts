import type { Command, Role } from "@attune/domain";

export type PcpRole = Extract<Role, "pcp_ma" | "pcp_physician">;

/** Who is acting in the portal right now. The signed-in switch is a demo control. */
export interface Actor {
  by: PcpRole;
  who: string;
}

/** `useAct`'s runner: applies a command, toasts refusals, returns true when it ran. */
export type Run = (cmd: Command, ok?: string) => boolean;
