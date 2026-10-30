import { useState } from "react";
import { ChevronRight, FileText } from "lucide-react";
import { DEMO_PATIENT } from "@attune/domain";
import { RADIUS, SIZE, T } from "../design/tokens";
import { Mark } from "../shared/Brand";
import { Button, Card, Notice } from "../shared/ui";
import { PageTitle } from "./Tracker";

const ANSWERS: Record<string, string> = {
  "Is my inositol working?": "Early read: yes. Since week 4, your acne severity fell from 7 to 3 while adherence stayed above 90%. Energy also went from 4 to 8. I'll check again at week 8, after two more weeks of data.",
  "What changed this quarter?": "Three things moved: acne down 4 points, cycle length from 58 to 41 days, and better morning energy. Your hair-growth score (mFG) went from 12 to 9.",
  "What should I ask my doctor?": "Worth raising: testosterone and SHBG, a fasting insulin recheck, whether to keep inositol or try something else, and the metabolic labs you haven't had in 12 months.",
};

export function Coach({ openDossier }: { openDossier: () => void }) {
  const [asked, setAsked] = useState<string | null>(null);
  const bubble = (text: string) => (
    <div className="flex gap-2.5">
      <span style={{ flexShrink: 0 }}><Mark size={28} /></span>
      <p className="px-3 py-2.5" style={{ background: T.sunken, borderRadius: RADIUS.md, fontSize: SIZE.body - 1, color: T.text, lineHeight: 1.5 }}>{text}</p>
    </div>
  );
  return (
    <div className="flex flex-col gap-4">
      <PageTitle title="Coach" sub="Answers come from your own tracked data." />
      <Notice tone="info">In this demo the answers are pre-written.</Notice>
      <Card>
        <div className="flex flex-col gap-3" aria-live="polite" style={{ minHeight: 200 }}>
          {bubble(`Hi ${DEMO_PATIENT.firstName}. I've looked at your last 12 weeks. Pick a question below.`)}
          {asked && (
            <>
              <div className="flex justify-end">
                <p className="px-3 py-2.5" style={{ background: T.brand, color: T.textOnBrand, borderRadius: RADIUS.md, fontSize: SIZE.body - 1 }}>{asked}</p>
              </div>
              {bubble(ANSWERS[asked] ?? "")}
            </>
          )}
        </div>
      </Card>
      <div className="flex flex-col gap-2">
        {Object.keys(ANSWERS).map((q) => (
          <button key={q} type="button" onClick={() => setAsked(q)} aria-pressed={asked === q} className="flex items-center justify-between px-4"
            style={{ minHeight: 48, background: T.surface, border: `1px solid ${asked === q ? T.brand : T.border}`, borderRadius: RADIUS.md, cursor: "pointer", fontSize: SIZE.body - 1, color: T.text, textAlign: "left" }}>
            {q}<ChevronRight size={18} color={T.textMuted} aria-hidden />
          </button>
        ))}
      </div>
      <Button kind="secondary" size="lg" full onClick={openDossier}><FileText size={18} aria-hidden /> Preview the summary for my doctor</Button>
    </div>
  );
}
