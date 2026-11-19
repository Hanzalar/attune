import { StrictMode, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { Pause, Timer } from "lucide-react";
import { RADIUS, SIZE, T } from "../design/tokens";
import { startTicker, useWorld, viewUrl, type View } from "./store";
import "../index.css";

const VIEWS: { id: View; label: string }[] = [
  { id: "patient", label: "Patient app" },
  { id: "pcp", label: "PCP portal" },
  { id: "specialist", label: "Specialist portal" },
  { id: "ops", label: "Ops" },
];

/** Presenter-only strip on every hosted view: where you are, the other views, the demo clock. Never part of the product. */
export function DemoBar({ here }: { here: View }) {
  const w = useWorld();
  const paused = w.clock.pausedAt !== null;
  return (
    <div className="no-print flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5" style={{ padding: "6px 12px", background: T.forest, color: T.cream, fontSize: SIZE.xs + 1 }}>
      <a href={viewUrl("demo")} style={{ fontWeight: 600, color: T.cream }}>Demo hub</a>
      <nav aria-label="Demo views" className="flex flex-wrap gap-1">
        {VIEWS.map((v) => (
          <a
            key={v.id} href={viewUrl(v.id)} target={v.id === here ? undefined : `attune-${v.id}`} aria-current={v.id === here ? "page" : undefined}
            style={{ padding: "2px 8px", borderRadius: RADIUS.sm, color: T.cream, background: v.id === here ? "rgba(250,244,238,.18)" : "transparent", fontWeight: v.id === here ? 600 : 400 }}
          >
            {v.label}
          </a>
        ))}
      </nav>
      <span className="inline-flex items-center gap-1" style={{ color: T.blush }}>
        {paused ? <Pause size={12} aria-hidden /> : <Timer size={12} aria-hidden />}
        Holds {paused ? "paused" : `at ${w.clock.speed}× speed`}{w.clock.offsetMs ? ` · clock +${Math.round(w.clock.offsetMs / 3_600_000)} h` : ""}
      </span>
      <span style={{ color: T.blush, opacity: 0.85 }}>Synthetic data · build {__BUILD_SHA__}</span>
    </div>
  );
}

/** Mount a hosted view and join the shared demo clock. */
export function mount(App: ComponentType) {
  startTicker();
  const el = document.getElementById("root");
  if (!el) throw new Error("Missing #root");
  createRoot(el).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
