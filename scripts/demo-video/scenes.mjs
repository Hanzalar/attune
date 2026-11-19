/**
 * The demo video, scene by scene. Each scene drives the live app through stage.html. Copy follows the product rules:
 * no claims the prototype can't back, demo replies labelled as such, synthetic data throughout.
 */
const PCP = "PCP portal · Cedar Family Medicine (example)";
const SPEC = "Specialist portal · Bluebonnet Endocrinology (example)";
const OPS = "Attune operations (mocked)";
const DEMO_NOTE = "AI scenes use demo replies (no AI model), the labelled stand-in this build runs without Claude credentials.";

export const SCENES = [
  {
    name: "title",
    async run({ stage, sleep }) {
      await stage("card", { big: "A cancellation, filled by someone ready.", sub: "A patient-owned PMOS record her PCP, gyno and endo all see, and a journal that keeps it current.", lines: ["Prototype · synthetic data"] });
      await stage("go", "desktop", "/pcp/#/board");
      await stage("go", "phone", "/patient/#/");
      await sleep(3800);
    },
  },
  {
    name: "ready",
    async run({ stage, sleep }) {
      await stage("scene", { layout: "split", overline: "Ready before anything opens", title: "Ari is on the waitlist.", step: "01 / 10", dlabel: PCP, desktop: "/pcp/#/board", phone: "/patient/#/",
        caption: "Her PCP referred her to an endocrinologist. It's signed, complete for the practice's criteria and insurance-checked, so she waits for the next opening." });
      await stage("uncard");
      await sleep(1200);
      await stage("spot", "desktop", "Ari Lindqvist", 2600);
      await stage("spot", "phone", "On waitlist", 2600);
      await sleep(600);
    },
  },
  {
    name: "post",
    async run({ stage, sleep }) {
      await stage("scene", { layout: "split", overline: "A cancellation", title: "The endo office posts tomorrow's opening.", step: "02 / 10", dlabel: SPEC, desktop: "/specialist/#/openings",
        caption: "The front desk picks the slot. Attune shows the hold it will use. The practice never sees who is waiting or picks patients." });
      await sleep(900);
      await stage("spot", "desktop", "Starts in", 2600);
      await stage("spot", "desktop", "You can't see the waitlist", 2400);
      await stage("point", "desktop", "Post opening", { click: true, wait: 2600 });
      await stage("hideCursor");
    },
  },
  {
    name: "offer",
    async run({ stage, sleep }) {
      await stage("scene", { layout: "split", overline: "The offer", title: "Ari gets it, with a hold.", step: "03 / 10",
        caption: "She and one other ready patient get the same offer. First to accept wins. Accepting is her consent to share her Patient Pack, and not before." });
      await sleep(800);
      await stage("spot", "phone", "A time opened up for you", 2600);
      await stage("point", "phone", "See details", { click: true, wait: 1600 });
      await stage("spot", "phone", "What accepting shares", 2600);
      await stage("point", "phone", "Accept this time", { click: true, wait: 2200 });
      await stage("spot", "desktop", "Ari Lindqvist", 2600);
      await stage("hideCursor");
    },
  },
  {
    name: "pack",
    async run({ stage, sleep }) {
      await stage("scene", { layout: "split", overline: "No retelling", title: "The front desk opens her Patient Pack.", step: "04 / 10",
        caption: "Her story in her words, the PCP's note, labs, check-in trends, medications and insurance, each with its source. The view is logged where she can see it." });
      await stage("point", "desktop", "Open Patient Pack", { click: true, wait: 1600 });
      await stage("scroll", "desktop", "PCP referral note", 2600);
      await sleep(900);
      await stage("scroll", "desktop", "Symptom trends", 2600);
      await sleep(1200);
      await stage("point", "phone", "Nothing has changed", { click: true, wait: 1800 });
      await stage("hideCursor");
    },
  },
  {
    name: "close",
    async run({ stage, sleep }) {
      await stage("controls", "/demo/", ["Skip to the booked visit"]);
      await stage("scene", { layout: "split", overline: "After the visit", title: "A summary closes the loop.", step: "05 / 10", dlabel: SPEC, desktop: "/specialist/#/openings",
        caption: "The endo marks the visit attended and uploads a summary. It lands in Ari's record and her PCP's inbox, and the referral closes." });
      await stage("point", "desktop", "Mark attended", { click: true, wait: 1400 });
      await stage("point", "desktop", "Upload visit summary", { click: true, wait: 1400 });
      await stage("type", "desktop", "textarea", "Reviewed her history, results and check-in trends with her. We agreed on a plan together and will review it at follow-up.", 38);
      await stage("point", "desktop", "Send summary", { click: true, wait: 1500 });
      await stage("hideCursor");
      await stage("go", "desktop", "/pcp/#/inbox", PCP);
      await stage("go", "phone", "/patient/#/");
      await stage("waitFor", "desktop", "Reviewed her history");
      await stage("spot", "desktop", "Reviewed her history", 2600);
      await stage("waitFor", "phone", "Your summary arrived");
      await stage("spot", "phone", "Your summary arrived", 2400);
    },
  },
  {
    name: "ledger",
    async run({ stage, sleep }) {
      await stage("scene", { layout: "desktop", overline: "Who pays", title: "One fee, owed by the endo practice. Nothing billed.", step: "06 / 10", dlabel: OPS, desktop: "/ops/#ledger",
        caption: "Fees accrue to the specialist practice only, and the prototype charges nothing. A healthcare attorney must clear the fee before any billing." });
      await sleep(800);
      await stage("spot", "desktop", "Bluebonnet Endocrinology (example)", 2400);
      await stage("spot", "desktop", "PCP practices", 1800);
      await stage("spot", "desktop", "Never charged for the referral loop", 1800);
    },
  },
  {
    name: "journal-card",
    async run({ stage, sleep }) {
      await stage("card", { big: "And a journal that keeps her record current.", sub: "She writes in plain words. An assistant drafts the updates. She decides what goes in.", lines: [] });
      await stage("go", "phone", "/patient/#/assistants");
      await sleep(3200);
    },
  },
  {
    name: "connect",
    async run({ stage, sleep }) {
      await stage("scene", { layout: "phone", overline: "AI-native", title: "She chooses what an assistant may read.", step: "07 / 10", phone: "/patient/#/assistants",
        points: ["Claude or ChatGPT connects like a practice.", "She picks the sections it can read.", "Every read is logged. She can revoke it."], caption: DEMO_NOTE });
      await stage("uncard");
      for (const i of [0, 1, 2]) { await stage("reveal", i); await sleep(500); }
      await stage("spot", "phone", "Labs and results", 1800);
      await stage("point", "phone", "Connect Claude", { click: true, wait: 1600 });
      await stage("spot", "phone", "Connector address", 2200);
      await stage("hideCursor");
    },
  },
  {
    name: "journal",
    async run({ stage, sleep }) {
      await stage("scene", { layout: "phone", overline: "Journal", title: "She writes. It drafts. She applies.", step: "08 / 10", phone: "/patient/#/journal",
        points: ["She writes the way she talks.", "Drafts: check-in scores, medication changes.", "Nothing changes until she applies it."], caption: DEMO_NOTE });
      await stage("reveal", 0);
      await stage("type", "phone", "textarea", "Slept terribly again, up at 3am. Skin broke out on my chin. Started magnesium last night.", 24);
      await stage("point", "phone", "Save to journal", { click: true, wait: 1800 });
      await stage("reveal", 1);
      await stage("scroll", "phone", "Recent entries", 1600);
      await stage("spot", "phone", "Check-in for", 2400);
      await stage("reveal", 2);
      await stage("point", "phone", "Apply all", { click: true, wait: 1600 });
      await stage("hideCursor");
    },
  },
  {
    name: "ask",
    async run({ stage, sleep }) {
      await stage("scene", { layout: "phone", overline: "Ask", title: "Questions answered from her own record.", step: "09 / 10", phone: "/patient/#/ask",
        points: ["Only the sections she shares.", "Every fact with its source and date.", "Never a diagnosis or treatment advice."], caption: DEMO_NOTE });
      await stage("reveal", 0);
      await stage("point", "phone", "How did I sleep this week?", { click: true, wait: 2200 });
      await stage("reveal", 1);
      await stage("type", "phone", "css:input", "What was my last A1c?", 22);
      await stage("point", "phone", "css:button[type=submit]", { click: true, wait: 2200 });
      await stage("spot", "phone", "lab range", 2600);
      await stage("reveal", 2);
      await stage("hideCursor");
      await sleep(800);
    },
  },
  {
    name: "connector",
    async run({ stage, sleep, connector, world }) {
      await stage("scene", { layout: "log", overline: "Native in Claude and ChatGPT", title: "Journal from the assistant she already uses.", step: "10 / 10", phone: "/patient/#/journal",
        caption: "Through Attune's MCP connector, an assistant reads what she shares, journals for her and drafts updates." });
      const w = await world();
      const token = w.assistants.find((l) => l.assistantId === "ai-claude" && !l.disconnectedAt)?.token;
      await stage("logHead", "Attune MCP connector", "Shown: Attune's connector test client, calling through Claude's connection. In Claude or ChatGPT, the assistant makes these calls.");
      const show = (html) => stage("logRow", html);
      const c = await connector(token, show);
      await c.call("read_record", {}, "");
      await sleep(600);
      await c.call("write_journal_entry", { text: "Energy crashed around 2pm. Feeling flat." }, "“Energy crashed around 2pm. Feeling flat.”");
      await sleep(600);
      await c.call("suggest_record_updates", { drafts: [{ kind: "checkIn", why: "Energy crashed around 2pm. Feeling flat.", date: null, mood: 2, sleep: null, energy: 2, skin: null, name: null, detail: null, text: null }] }, "check-in: mood 2, energy 2");
      await c.close();
      await stage("waitFor", "phone", "Written in Claude");
      await stage("scroll", "phone", "Recent entries", 1400);
      await stage("spot", "phone", "Written in Claude", 2800);
    },
  },
  {
    name: "outro",
    async run({ stage, sleep }) {
      await stage("card", { big: "Attune", sub: "Patient-owned. Never ranked by who pays. Drafts, never diagnoses.", lines: ["Prototype · synthetic data · nothing billed"] });
      await sleep(4200);
    },
  },
];
