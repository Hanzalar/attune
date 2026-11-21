/**
 * Video 2: her own AI assistant, connected. Attune has no chatbot: she talks to her assistant, which reaches her
 * record through Attune's connector. The assistant on screen is a scripted demo client, labelled as such; every call
 * it makes to the connector is real, and its answers are built from what the connector returned.
 */
const N = 4;
const SCRIPTED = "Scripted demo client · its calls to Attune's connector are real";

/** "5.7 %", "2026-09-22", "4.0–5.6", "Cedar Family Medicine chart (example)" from the record text. */
function a1c(record) {
  const m = record.match(/A1c: (.+?) \(lab range (.+?)\), collected (\d{4}-\d{2}-\d{2}), source: (.+?)\.\n/);
  if (!m) return null;
  const date = new Date(`${m[3]}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" });
  return { value: m[1], range: m[2], date, source: m[4] };
}

export default {
  slug: "2-ai-assistant",
  title: "Attune · Your AI assistant, connected",
  world: "Start at the fill",
  speed: "10×",
  scenes: [
    { chapter: "Title", async run({ stage, sleep }) {
      await stage("card", { kicker: "Attune · Video 2 of 3", big: "Your AI assistant, connected", sub: "She talks to Claude or ChatGPT. Attune keeps her record and asks her before anything changes.", meta: "About one minute · Prototype · synthetic data" });
      await stage("go", "phone", "/patient/#/assistants");
      await sleep(1900);
    } },
    { chapter: "Connect", async run({ stage }) {
      await stage("scene", { layout: "phone", step: [1, N], overline: "Connect", title: "She picks what her assistant can read.", phone: "/patient/#/assistants",
        points: ["Like sharing with a practice.", "Section by section.", "She can switch it off any time."], caption: "Attune has no chatbot of its own. Her assistant connects through Attune's connector." });
      await stage("uncard");
      await stage("reveal", 0);
      await stage("spot", "phone", "Labs and results", 1200, false);
      await stage("reveal", 1);
      await stage("point", "phone", "Connect Claude", { click: true, wait: 900 });
      await stage("hideCursor");
      await stage("reveal", 2);
      await stage("spot", "phone", "css:code", 1300, false);
    } },
    { chapter: "Journal", async run({ stage, connector, world }) {
      await stage("scene", { layout: "chat", step: [2, N], overline: "Journal in her assistant", title: "She tells her assistant how she is.", phone: "/patient/#/",
        caption: "Shown: a scripted client standing in for Claude. Its calls to Attune are real." });
      await stage("chatOpen", SCRIPTED);
      const token = (await world()).assistants.find((l) => l.assistantId === "ai-claude" && !l.disconnectedAt)?.token;
      const c = await connector(token);
      await stage("chatUser", "Rough night, up at 3am again. My skin broke out on my chin, and I started magnesium yesterday. Can you log that in Attune?", 34);
      await stage("chatTool", "write_journal_entry");
      await c.call("write_journal_entry", { text: "Rough night, up at 3am again. My skin broke out on my chin, and I started magnesium yesterday." });
      await stage("chatToolDone", "write_journal_entry", "saved to her journal");
      await stage("chatTool", "suggest_record_updates");
      await c.call("suggest_record_updates", { drafts: [
        { kind: "checkIn", why: "Rough night, up at 3am again. My skin broke out on my chin.", date: null, mood: null, sleep: 1, energy: null, skin: 2, name: null, detail: null, text: null },
        { kind: "addMed", why: "I started magnesium yesterday.", date: null, mood: null, sleep: null, energy: null, skin: null, name: "Magnesium", detail: "Started yesterday", text: null },
      ] });
      await stage("chatToolDone", "suggest_record_updates", "2 suggestions");
      await stage("chatSay", "Logged in your Attune journal. I suggested today's sleep and skin scores, and adding magnesium to your medications. They wait for you to apply them in Attune.");
      await c.close();
      await stage("waitFor", "phone", "to review");
      await stage("spot", "phone", "to review", 1500);
      await stage("point", "phone", "Review updates", { click: true, wait: 800 });
      await stage("point", "phone", "Apply all", { click: true, wait: 900 });
      await stage("hideCursor");
    } },
    { chapter: "Ask", async run({ stage, connector, world }) {
      await stage("scene", { layout: "chat", step: [3, N], overline: "Ask about her record", title: "Answers come only from what she shares.", phone: "/patient/#/record",
        caption: "Each fact comes with its source and date. No diagnosis, no treatment advice." });
      const token = (await world()).assistants.find((l) => l.assistantId === "ai-claude" && !l.disconnectedAt)?.token;
      const c = await connector(token);
      await stage("chatUser", "What was my last A1c?", 26);
      await stage("chatTool", "read_record");
      const record = await c.call("read_record", {});
      const r = a1c(record);
      await stage("chatToolDone", "read_record", "the sections she shares");
      await stage("chatSay", r
        ? `Your last A1c was ${r.value}, on ${r.date}. The lab's printed range is ${r.range}. Source: ${r.source}. What it means for you is a question for your care team; I can note it in your journal.`
        : "I couldn't find an A1c in what you share with me.");
      await c.close();
      await stage("waitFor", "phone", "Claude read your");
      await stage("spot", "phone", "Claude read your", 1800, false);
    } },
    { chapter: "Her rules", async run({ stage, connector, world }) {
      await stage("scene", { layout: "chat", step: [4, N], overline: "Her rules", title: "She switches labs off. It can't see them.", phone: "/patient/#/assistants",
        caption: "The assistant only ever sees what she shares right now, and every change is logged." });
      await stage("point", "phone", "Labs and results", { click: true, wait: 900 });
      await stage("hideCursor");
      const token = (await world()).assistants.find((l) => l.assistantId === "ai-claude" && !l.disconnectedAt)?.token;
      const c = await connector(token);
      await stage("chatUser", "And my TSH?", 26);
      await stage("chatTool", "read_record");
      const record = await c.call("read_record", {});
      const hidden = /Not shared with you: .*Labs and results/.test(record);
      await stage("chatToolDone", "read_record", hidden ? "labs not shared" : "the sections she shares");
      await stage("chatSay", hidden
        ? "You aren't sharing your labs with me in Attune right now, so I can't see your TSH. You can switch labs back on in Attune."
        : "Your labs are shared with me; let me look.");
      await c.close();
    } },
    { chapter: "Recap", async run({ stage, sleep }) {
      await stage("card", { kicker: "What you saw", big: "Your AI assistant, connected", lines: ["She talks to Claude or ChatGPT; Attune holds the record", "Journal there, and updates wait for her approval", "Answers come only from what she shares, with sources", "Every read is logged, and she can switch sections off"], meta: "Attune prototype · synthetic data · scripted assistant client" });
      await sleep(3800);
    } },
  ],
};
