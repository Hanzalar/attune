import { Hourglass, MapPin, Stethoscope } from "lucide-react";
import type { RankedMatch, Slot } from "@attune/domain";
import { RADIUS, SIZE, T } from "../../design/tokens";
import { Button, Card, Label, SlotButton, StatusPill } from "../../shared/ui";

const TZ = "America/Chicago";

/** Day and time for a slot button, in the practice's time zone. */
export function slotParts(s: Slot) {
  const d = new Date(s.at);
  return {
    day: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: TZ }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ }),
  };
}

export function slotLong(s: Slot) {
  const { day, time } = slotParts(s);
  return `${day} at ${time}`;
}

function initials(name: string) {
  return name.replace(/^Dr\.\s*/, "").replace(/\s*\(.*\)$/, "").split(/\s+/).map((w) => w[0]).slice(0, 2).join("");
}

/**
 * One matched OB/GYN: network, distance, experience and the next openings as tappable times.
 * Reads only ranking fields; commercial status never reaches this card.
 */
export function ProviderCard({ match, selected, held, locked, onPickSlot, onWaitlist }: {
  match: RankedMatch;
  selected: boolean;
  held: Slot | null;
  locked: boolean;
  onPickSlot: (s: Slot) => void;
  onWaitlist: () => void;
}) {
  const m = match.specialist;
  return (
    <Card selected={selected}>
      <div className="flex items-start gap-3">
        <span aria-hidden className="flex items-center justify-center"
          style={{ width: 44, height: 44, borderRadius: 22, background: T.sunken, color: T.textMuted, fontSize: SIZE.body, fontWeight: 600, flexShrink: 0 }}>
          {initials(m.name)}
        </span>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: SIZE.body, fontWeight: 600, color: T.text, lineHeight: 1.3 }}>{m.name}</h3>
          <p style={{ fontSize: SIZE.sm, color: T.textMuted }}>{m.practice} · {m.specialty}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3" style={{ fontSize: SIZE.sm, color: T.textMuted }}>
        <StatusPill tone={m.network === "in" ? "success" : "danger"}>{match.reasons[0]}</StatusPill>
        <span className="flex items-center gap-1 tnum"><MapPin size={14} aria-hidden /> {m.miles.toFixed(1)} mi</span>
        {m.pmosExperience === 2
          ? <span className="flex items-center gap-1"><Stethoscope size={14} aria-hidden /> Sees PMOS patients often</span>
          : <span>{m.fitNote}</span>}
      </div>
      <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${T.border}` }}>
        {m.openSlots.length > 0 ? (
          <>
            <Label>Next openings</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {m.openSlots.map((s) => {
                const { day, time } = slotParts(s);
                return <SlotButton key={s.at} day={day} time={time} disabled={locked} selected={selected && held?.at === s.at} onClick={() => onPickSlot(s)} />;
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5" style={{ fontSize: SIZE.sm, color: T.textMuted }}><Hourglass size={14} aria-hidden /> No openings right now</span>
            <Button kind={selected ? "primary" : "secondary"} disabled={locked} onClick={onWaitlist}>{selected ? "Chosen · waitlist" : "Choose and join waitlist"}</Button>
          </div>
        )}
      </div>
      {selected && held && (
        <p className="mt-3 px-3 py-2" style={{ background: T.brandSoft, color: T.brandInk, borderRadius: RADIUS.sm, fontSize: SIZE.sm, fontWeight: 600 }}>
          We'll request {slotLong(held)} and hold it while your PCP's office signs off.
        </p>
      )}
    </Card>
  );
}
