/**
 * Attune patient app: an installable, mobile-first web app over the shared demo world. One column, no tab bar:
 * Home plus two header icons (Record and Care team). Notifications show as an in-app banner with the exact text a
 * push would carry, which never includes health details.
 */
import { useState } from "react";
import { Bell, X } from "lucide-react";
import { DEMO_TZ, patientHome, type Notice as NoticeT, type World } from "@attune/domain";
import { RADIUS, SHADOW, SIZE, T } from "../design/tokens";
import { DemoBar, mount } from "../shared/DemoBar";
import { useNow, useWorld } from "../shared/store";
import { Booked } from "./Booked";
import { Care } from "./Care";
import { CheckIn } from "./CheckIn";
import { Home } from "./Home";
import { Insurance } from "./Insurance";
import { PATIENT_ID, go, useRoute, type Route } from "./nav";
import { Offer } from "./Offer";
import { Onboarding } from "./Onboarding";
import { Pack, Summary } from "./Pack";
import { Record } from "./Record";
import { Share } from "./Share";
import { Waitlist } from "./Waitlist";

const SEEN_KEY = "attune.patient.lastNoticeAt";

function readSeen(fallback: string): string {
  try {
    return localStorage.getItem(SEEN_KEY) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeSeen(at: string) {
  try {
    localStorage.setItem(SEEN_KEY, at);
  } catch {
    // Blocked storage: the banner simply reappears on reload.
  }
}

function newest(w: World): NoticeT | undefined {
  return w.notices.filter((n) => n.to.kind === "patient" && n.to.id === PATIENT_ID).at(-1);
}

/** The newest message she hasn't seen. History from before this tab opened counts as seen. */
function Banner({ w, now }: { w: World; now: string }) {
  const [seen, setSeen] = useState(() => readSeen(newest(w)?.at ?? ""));
  const latest = newest(w);
  if (!latest || latest.at <= seen) return null;
  const done = () => {
    writeSeen(latest.at);
    setSeen(latest.at);
  };
  const offer = patientHome(w, PATIENT_ID, now, DEMO_TZ).offer;
  return (
    <div role="status" className="rise no-print" style={{ position: "sticky", top: 0, zIndex: 40, padding: "8px 12px 0" }}>
      <div className="flex items-start gap-3" style={{ background: T.forest, color: T.cream, borderRadius: RADIUS.md, padding: "12px 12px 12px 14px", boxShadow: SHADOW.overlay }}>
        <Bell size={18} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: SIZE.sm, lineHeight: 1.45, margin: 0, flex: 1 }}>{latest.text}</p>
        <button
          type="button"
          onClick={() => {
            done();
            go(offer ? `/offer/${offer.offer.id}` : "/");
          }}
          style={{ fontSize: SIZE.sm, fontWeight: 600, color: T.blush, minHeight: 44, padding: "0 6px", marginTop: -12, marginBottom: -12, cursor: "pointer" }}
        >
          Open
        </button>
        <button type="button" onClick={done} aria-label="Dismiss" style={{ color: T.cream, minWidth: 44, minHeight: 44, margin: "-12px -8px -12px 0", cursor: "pointer" }} className="inline-flex items-center justify-center">
          <X size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
}

function Current({ route, w, now }: { route: Route; w: World; now: string }) {
  const patient = w.patients.find((p) => p.id === PATIENT_ID);
  if (!patient) return null;
  // Onboarding owns #/welcome, so its closing note stays up after she finishes.
  if (!patient.onboardedAt || route.name === "welcome") return <Onboarding />;
  switch (route.name) {
    case "checkin": return <CheckIn w={w} patient={patient} now={now} />;
    case "record": return <Record w={w} patient={patient} now={now} />;
    case "care": return <Care w={w} patient={patient} />;
    case "share": return <Share w={w} patient={patient} now={now} />;
    case "insurance": return <Insurance w={w} patient={patient} now={now} />;
    case "waitlist": return <Waitlist w={w} patient={patient} now={now} />;
    case "offer": return <Offer w={w} patient={patient} id={route.id} now={now} />;
    case "booked": return <Booked w={w} patient={patient} now={now} />;
    case "pack": return <Pack w={w} patient={patient} now={now} />;
    case "summary": return <Summary w={w} patient={patient} />;
    case "home": return <Home w={w} patient={patient} now={now} />;
  }
}

function App() {
  const w = useWorld();
  const now = useNow(1000);
  const route = useRoute();
  return (
    <div style={{ minHeight: "100dvh", background: T.bone }}>
      <DemoBar here="patient" />
      <div style={{ maxWidth: 440, margin: "0 auto", overflowX: "hidden" }}>
        <Banner w={w} now={now} />
        <Current route={route} w={w} now={now} />
      </div>
    </div>
  );
}

mount(App);
