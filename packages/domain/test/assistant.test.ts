import { describe, expect, it } from "vitest";
import {
  ASSISTANT_DEFAULT_SECTIONS, ASSISTANT_RULES, DEMO_TZ, LOCAL_ASSISTANT, assistantContext, demoAnswer, demoJournal, run,
  type Command, type World,
} from "../src";
import { NOW, ari, fill, later, who } from "./helpers";

const claude = { by: "assistant" as const, who: "Claude (Anthropic)" };
const TOKEN = "tok_0123456789abcdefghijklmnop";
const go = (w: World, cmd: Command, at = NOW) => run(w, cmd, at);
const connect = (w: World, sections = [...ASSISTANT_DEFAULT_SECTIONS]) =>
  go(w, { ...who.patient, type: "connectAssistant", patientId: ari, assistantId: "ai-claude", sections, token: TOKEN });

describe("connecting an assistant", () => {
  it("is a consent recipient: only granted sections reach it, and connecting is logged", () => {
    const w = connect(fill(), ["results", "trends"]);
    const ctx = assistantContext(w, ari, "ai-claude", NOW, DEMO_TZ);
    expect(ctx.sections).toEqual(["trends", "results"]);
    expect(ctx.text).toContain("A1c: 5.7 %");
    expect(ctx.text).not.toContain("I've told this story");
    expect(ctx.text).not.toContain("0417");
    expect(ctx.text).toMatch(/Not shared with you: .*Your story/);
    expect(w.log.at(-1)).toMatchObject({ summary: "Patient connected Claude (Anthropic)", shared: { recipientId: "ai-claude", sections: ["results", "trends"] } });
  });

  it("refuses to connect twice, and disconnecting ends every grant", () => {
    let w = connect(fill());
    expect(() => connect(w)).toThrow(/already connected/);
    w = go(w, { ...who.patient, type: "disconnectAssistant", patientId: ari, assistantId: "ai-claude" }, later(NOW, 1));
    expect(assistantContext(w, ari, "ai-claude", NOW, DEMO_TZ).sections).toEqual([]);
    expect(w.assistants[0]?.disconnectedAt).not.toBeNull();
  });

  it("logs each read as a view she can see, and refuses sections she didn't grant", () => {
    let w = connect(fill(), ["results"]);
    w = go(w, { ...claude, type: "viewRecord", patientId: ari, recipientId: "ai-claude", sections: ["results"] });
    expect(w.views.at(-1)).toMatchObject({ recipientId: "ai-claude", sections: ["results"] });
    expect(() => go(w, { ...claude, type: "viewRecord", patientId: ari, recipientId: "ai-claude", sections: ["meds"] }, later(NOW, 20))).toThrow(/medications/);
  });
});

describe("journal and drafts", () => {
  it("an unconnected assistant can't write to her journal or draft updates", () => {
    expect(() => go(fill(), { ...claude, type: "writeJournal", patientId: ari, text: "Slept badly.", assistantId: "ai-claude" })).toThrow(/isn't connected/);
    expect(() => go(fill(), { ...claude, type: "assistantReply", patientId: ari, assistantId: "ai-claude", entryId: null, reply: "", proposals: [] })).toThrow(/isn't connected/);
  });

  it("drafts change nothing until she applies them; invalid drafts are dropped and counted", () => {
    let w = connect(fill());
    w = go(w, { ...who.patient, type: "writeJournal", patientId: ari, text: "Slept badly again and started magnesium.", assistantId: null });
    const before = w.patients.find((p) => p.id === ari)!;
    w = go(w, {
      ...claude, type: "assistantReply", patientId: ari, assistantId: "ai-claude", entryId: "j-1", reply: "Noted. Rough night.",
      proposals: [
        { proposal: { kind: "checkIn", date: "2026-11-18", sleep: 2 }, why: "Slept badly again" },
        { proposal: { kind: "addMed", name: "Magnesium", detail: "Started recently" }, why: "started magnesium" },
        { proposal: { kind: "checkIn", date: "2026-11-18", sleep: 9 as never }, why: "bad score" },
        { proposal: { kind: "stopMed", name: "Metformin" }, why: "not on her list" },
      ],
    });
    expect(w.proposals.map((p) => p.status)).toEqual(["pending", "pending"]);
    expect(w.log.at(-1)?.summary).toMatch(/drafted 2 updates.*2 invalid drafts dropped/);
    expect(w.patients.find((p) => p.id === ari)).toEqual(before);
    expect(w.journal[0]?.reply).toBe("Noted. Rough night.");

    w = go(w, { ...who.patient, type: "applyProposal", proposalId: "d-1" });
    w = go(w, { ...who.patient, type: "dismissProposal", proposalId: "d-2" });
    const p = w.patients.find((x) => x.id === ari)!;
    expect(p.checkIns.find((c) => c.date === "2026-11-18")).toEqual({ date: "2026-11-18", sleep: 2 });
    expect(p.meds.map((m) => m.name)).not.toContain("Magnesium");
    expect(() => go(w, { ...who.patient, type: "applyProposal", proposalId: "d-1" })).toThrow(/already handled/);
    expect(() => go(w, { ...claude, type: "applyProposal", proposalId: "d-2" })).toThrow(/Only she decides/);
  });

  it("merges a partial check-in into the day's existing one", () => {
    let w = connect(fill());
    w = go(w, { ...who.patient, type: "logCheckIn", patientId: ari, checkIn: { date: "2026-11-18", mood: 3, sleep: 4, energy: 3, skin: 4 } });
    w = go(w, { ...claude, type: "assistantReply", patientId: ari, assistantId: "ai-claude", entryId: null, reply: "", proposals: [{ proposal: { kind: "checkIn", date: "2026-11-18", sleep: 1 }, why: "" }] });
    w = go(w, { ...who.patient, type: "applyProposal", proposalId: w.proposals.at(-1)!.id });
    expect(w.patients.find((x) => x.id === ari)!.checkIns.at(-1)).toEqual({ date: "2026-11-18", mood: 3, sleep: 1, energy: 3, skin: 4 });
  });

  it("an assistant journaling on her behalf (from Claude) needs the connection, and is labelled as such", () => {
    let w = connect(fill());
    w = go(w, { ...claude, type: "writeJournal", patientId: ari, text: "Logged from Claude: skin broke out.", assistantId: "ai-claude" });
    expect(w.journal.at(-1)).toMatchObject({ source: "ai-claude" });
    expect(w.log.at(-1)?.summary).toBe("Patient wrote a journal entry through Claude");
  });

  it("demo replies come only from Attune itself", () => {
    expect(() => go(fill(), { ...claude, type: "assistantReply", patientId: ari, assistantId: LOCAL_ASSISTANT.id, entryId: null, reply: "", proposals: [] })).toThrow(/Attune itself/);
    const w = go(fill(), { by: "agent", who: "Attune", type: "assistantReply", patientId: ari, assistantId: LOCAL_ASSISTANT.id, entryId: null, reply: "", proposals: [] });
    expect(w.log.at(-1)?.summary).toMatch(/Demo replies/);
  });
});

describe("demo replies follow the same rules", () => {
  const DIAGNOSIS = /\b(you have|diagnos|pmos|pcos|prediabet|insulin resistan|you should take|dose|treat)\w*/i;

  it("drafts today's scales and a new medication from plain words", () => {
    const meds = fill().patients.find((p) => p.id === ari)!.meds;
    const out = demoJournal("Slept terribly again, up at 3am. Skin broke out on my chin. Started magnesium last night.", "2026-11-18", meds);
    expect(out.proposals.map((p) => p.proposal)).toEqual([
      { kind: "checkIn", date: "2026-11-18", sleep: 1, skin: 2 },
      { kind: "addMed", name: "Magnesium", detail: "Started recently" },
    ]);
    expect(out.reply).not.toMatch(DIAGNOSIS);
  });

  it("answers about labs with the value, date, range and source, and no interpretation", () => {
    const w = fill();
    const a = demoAnswer(w, ari, "What was my last A1c?", NOW, DEMO_TZ, ["results"]);
    expect(a.answer).toContain("A1c 5.7 %");
    expect(a.answer).toContain("outside the range the lab printed");
    expect(a.answer).toContain("Cedar Family Medicine chart (example)");
    expect(a.answer).not.toMatch(DIAGNOSIS);
    expect(demoAnswer(w, ari, "What was my last A1c?", NOW, DEMO_TZ, []).answer).toMatch(/haven't shared labs/);
  });

  it("the assistant rules forbid diagnosis and treatment advice", () => {
    expect(ASSISTANT_RULES).toMatch(/Never diagnose/);
    expect(ASSISTANT_RULES).toMatch(/never recommend or adjust treatment/);
  });
});
