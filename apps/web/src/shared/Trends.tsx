import { CHECKIN_SCALES, trends, type CheckIn } from "@attune/domain";
import { SERIES, SIZE, T } from "../design/tokens";

/** Patient-logged check-ins as small lines, one per scale. Display only: no scores, flags or interpretation. */
export function Trends({ checkIns, today, days = 14, dense }: { checkIns: CheckIn[]; today: string; days?: number; dense?: boolean }) {
  const data = trends(checkIns, today, days);
  const logged = data.lines[0]?.points.filter((p) => p !== null).length ?? 0;
  const w = 240;
  const h = dense ? 30 : 38;
  const x = (i: number) => (i / Math.max(1, days - 1)) * (w - 8) + 4;
  const y = (v: number) => h - 4 - ((v - 1) / 4) * (h - 8);
  return (
    <div className="flex flex-col gap-2">
      {data.lines.map((line) => {
        const scale = CHECKIN_SCALES[line.key];
        const segments: string[] = [];
        let current = "";
        line.points.forEach((p, i) => {
          if (p === null) {
            if (current) segments.push(current);
            current = "";
          } else current += `${current ? " L" : "M"}${x(i).toFixed(1)} ${y(p).toFixed(1)}`;
        });
        if (current) segments.push(current);
        return (
          <div key={line.key} className="grid items-center gap-3" style={{ gridTemplateColumns: "72px 1fr 64px" }}>
            <span style={{ fontSize: SIZE.sm, fontWeight: 600, color: T.forest }}>{scale.label}</span>
            <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label={`${scale.label}: ${line.points.map((p) => p ?? "no entry").join(", ")} over ${days} days, 1 is ${scale.low}, 5 is ${scale.high}`} preserveAspectRatio="none">
              <line x1="0" x2={w} y1={y(3)} y2={y(3)} stroke={T.hairline} strokeDasharray="2 3" />
              {segments.map((d, i) => (
                <path key={i} d={d} fill="none" stroke={SERIES[line.key]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              ))}
              {line.points.map((p, i) => (p === null ? null : <circle key={i} cx={x(i)} cy={y(p)} r="2.2" fill={SERIES[line.key]} />))}
            </svg>
            <span className="tnum" style={{ fontSize: SIZE.sm, color: T.inkMuted, textAlign: "right" }}>{line.average === null ? "—" : `avg ${line.average}`}</span>
          </div>
        );
      })}
      <p style={{ fontSize: SIZE.sm, color: T.inkMuted, margin: 0 }}>
        {logged} of the last {days} days logged by the patient. 1 is the low end of each scale, 5 the high end.
      </p>
    </div>
  );
}
