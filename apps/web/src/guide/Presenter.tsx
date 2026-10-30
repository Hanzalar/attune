import { viewUrl, type View } from "../shared/store";
import { FONT, RADIUS, SIZE, T } from "../design/tokens";

const WHO_MOVES: [string, string, string][] = [
  ["1 to 3", "Patient", "Patient app: tap a time, choose what's shared, send"],
  ["4", "PCP office", "PCP admin: confirm codes, then Sign and send"],
  ["5", "Attune", "Happens on its own after signing"],
  ["6", "Specialist office", "Specialist admin: Confirm the requested time"],
  ["7", "Patient", "Patient app: I had my visit"],
];

/** From the patient questions in open-questions.md on the business branch. */
const QUESTIONS = [
  "At step 2: would you let an app pull your portal records and labs to build a referral? What would stop you?",
  "At step 4: have you ever skipped or lost a referral? What happened: insurance, the wait, nobody called back?",
  "At step 6: did you go through your primary care doctor, or straight to a gynecologist?",
  "At the end: would you pay for something that gets you seen sooner? Once, or monthly?",
];

const NOT_BUILT = [
  "Nothing is really sent. Portal and lab pulls, fax delivery and booking are simulated.",
  "Coach answers are scripted. Photos and starting a new trial aren't built; the app says so.",
  "Check-ins on the Today tab aren't saved.",
  "The three views share one record only inside one browser. A phone and a laptop won't sync yet.",
];

const VIEWS: [View, string][] = [["patient", "Patient app"], ["pcp", "PCP admin"], ["specialist", "Specialist admin"]];

const h3 = { fontSize: SIZE.md - 1, fontWeight: 600, color: T.text } as const;
const list = "flex flex-col gap-1.5 pl-5";

export function PresenterNotes() {
  return (
    <details className="px-5 py-4" style={{ background: T.surface, border: `1px dashed ${T.borderStrong}`, borderRadius: RADIUS.md }}>
      <summary style={{ cursor: "pointer", fontWeight: 600, color: T.brand }}>For the person running the session</summary>
      <div className="flex flex-col gap-6 mt-4" style={{ fontSize: SIZE.body - 1, color: T.text }}>
        <section className="flex flex-col gap-2">
          <h3 style={h3}>Setting up</h3>
          <ol className={`${list} list-decimal`}>
            <li>
              Open the three views as tabs in the same browser:{" "}
              {VIEWS.map(([id, label], i) => (
                <span key={id}>{i > 0 && ", "}<a href={viewUrl(id)} target={`attune-${id}`} style={{ color: T.brand, fontWeight: 600 }}>{label}</a></span>
              ))}. They share one record and update live.
            </li>
            <li>Press <b>Reset demo</b> in the bar at the bottom of any view before each session.</li>
            <li>Show the patient app full screen. Switch to the other tabs only to move the story forward.</li>
          </ol>
        </section>
        <section className="flex flex-col gap-2">
          <h3 style={h3}>Who moves each step</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: SIZE.sm, minWidth: 520 }}>
              <thead>
                <tr>{["Step", "Who acts", "Where you click"].map((t) => (
                  <th key={t} style={{ textAlign: "left", padding: "8px 12px", borderBottom: `1px solid ${T.border}`, fontSize: SIZE.xs, letterSpacing: "0.04em", textTransform: "uppercase", color: T.textMuted }}>{t}</th>
                ))}</tr>
              </thead>
              <tbody>
                {WHO_MOVES.map((row) => (
                  <tr key={row[0]}>{row.map((cell, i) => (
                    <td key={i} style={{ padding: "8px 12px", borderBottom: `1px solid ${T.border}`, verticalAlign: "top", fontFamily: i === 0 ? FONT.mono : undefined }}>{cell}</td>
                  ))}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="flex flex-col gap-2">
          <h3 style={h3}>Questions to ask along the way</h3>
          <ul className={`${list} list-disc`}>{QUESTIONS.map((q) => <li key={q}>{q}</li>)}</ul>
        </section>
        <section className="flex flex-col gap-2">
          <h3 style={h3}>Don't promise what isn't built</h3>
          <ul className={`${list} list-disc`}>{NOT_BUILT.map((q) => <li key={q}>{q}</li>)}</ul>
        </section>
      </div>
    </details>
  );
}
