/** Demo clock and reset controls, used by the demo hub and the ops screen. Presenter tools, not product features. */
import { useState } from "react";
import { FastForward, Pause, Play, RotateCcw, Undo2 } from "lucide-react";
import { DEMO_PEOPLE, DEMO_SPEEDS, type Command } from "@attune/domain";
import { SIZE, T } from "../design/tokens";
import { when } from "./format";
import { resetWorld, useWorld } from "./store";
import { Button, Chip } from "./ui";

const OPS = { by: "ops" as const, who: DEMO_PEOPLE.ops };

export function ClockControls({ run }: { run: (cmd: Command, ok?: string) => boolean }) {
  const w = useWorld();
  const [confirm, setConfirm] = useState<"fresh" | "fill" | null>(null);
  const paused = w.clock.pausedAt !== null;
  const booked = w.slots
    .filter((s) => s.status === "filled" || s.status === "confirmed")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];

  const skipToVisit = () => {
    if (!booked) return;
    const target = new Date(booked.startsAt).getTime() + 10 * 60_000;
    run({ ...OPS, type: "setClock", clock: { offsetMs: target - Date.now() } }, `Demo clock moved to 10 minutes into the visit (${when(booked.startsAt)}).`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p style={{ fontSize: SIZE.sm, fontWeight: 600, margin: "0 0 6px" }}>Hold windows</p>
        <div className="flex flex-wrap gap-2">
          {DEMO_SPEEDS.map((s) => (
            <Chip key={s} selected={w.clock.speed === s} onClick={() => run({ ...OPS, type: "setClock", clock: { speed: s } }, s === 1 ? "Holds run in real time." : `Holds run ${s}× faster.`)}>
              {s === 1 ? "Real time" : s === 60 ? "60× (minutes become seconds)" : `${s}×`}
            </Chip>
          ))}
        </div>
        <p style={{ fontSize: SIZE.sm, color: T.inkMuted, margin: "6px 0 0" }}>Applies to offers sent from now on. Pausing stops holds from running out; resuming adds the paused time back.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="md" variant="secondary" icon={paused ? <Play size={16} aria-hidden /> : <Pause size={16} aria-hidden />} onClick={() => run({ ...OPS, type: "setClock", clock: { paused: !paused } }, paused ? "Timers resumed." : "Timers paused.")}>
          {paused ? "Resume timers" : "Pause timers"}
        </Button>
        <Button size="md" variant="secondary" icon={<FastForward size={16} aria-hidden />} disabled={!booked} onClick={skipToVisit}>
          Skip to the booked visit
        </Button>
        {w.clock.offsetMs !== 0 && (
          <Button size="md" variant="quiet" icon={<Undo2 size={16} aria-hidden />} onClick={() => run({ ...OPS, type: "setClock", clock: { offsetMs: 0 } }, "Back to real time.")}>
            Back to real time
          </Button>
        )}
      </div>
      {!booked && <p style={{ fontSize: SIZE.sm, color: T.inkMuted, margin: 0 }}>“Skip to the booked visit” works once a slot is filled.</p>}
      <div className="flex flex-wrap items-center gap-2" style={{ borderTop: `1px solid ${T.hairline}`, paddingTop: 12 }}>
        {confirm ? (
          <>
            <span style={{ fontSize: SIZE.sm }}>Reset everything in this browser?</span>
            <Button size="md" icon={<RotateCcw size={16} aria-hidden />} onClick={() => { resetWorld(confirm); setConfirm(null); }}>Yes, reset</Button>
            <Button size="md" variant="quiet" onClick={() => setConfirm(null)}>Cancel</Button>
          </>
        ) : (
          <>
            <Button size="md" onClick={() => setConfirm("fill")}>Start at the fill</Button>
            <Button size="md" variant="secondary" onClick={() => setConfirm("fresh")}>Start from a fresh install</Button>
          </>
        )}
      </div>
    </div>
  );
}
