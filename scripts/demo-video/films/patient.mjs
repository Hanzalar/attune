/** Video 3: her first minutes in Attune, from a fresh install to a record she controls. */
const N = 5;
const DOB = "1998-04-09";

export default {
  slug: "3-patient-experience",
  title: "Attune · Her first minutes",
  world: "Start from a fresh install",
  speed: "10×",
  scenes: [
    { chapter: "Title", async run({ stage, sleep }) {
      await stage("card", { kicker: "Attune · Video 3 of 3", big: "Her first minutes in Attune", sub: "Three questions, a one-minute check-in, and a record she controls.", meta: "About one minute · Prototype · synthetic data" });
      await stage("go", "phone", "/patient/#/welcome");
      await sleep(1800);
    } },
    { chapter: "Onboarding", async run({ stage, sleep }) {
      await stage("scene", { layout: "phone", step: [1, N], overline: "Onboarding", title: "Three questions, no more.", phone: "/patient/#/welcome",
        points: ["What's been hardest lately.", "What she wants help with.", "What she has tried."], caption: "Nobody sees her answers unless she shares them." });
      await stage("uncard");
      await stage("reveal", 0);
      for (const chip of ["Sleep", "Irregular cycles"]) await stage("point", "phone", chip, { click: true, fast: true });
      await stage("point", "phone", "Continue", { click: true, wait: 250, fast: true });
      await stage("reveal", 1);
      await stage("point", "phone", "Not retelling my story", { click: true, fast: true });
      await stage("point", "phone", "Continue", { click: true, wait: 250, fast: true });
      await stage("reveal", 2);
      await stage("point", "phone", "Birth control", { click: true, fast: true });
      await stage("point", "phone", "Finish", { click: true, wait: 500, fast: true });
      await stage("hideCursor");
      await stage("spot", "phone", "You told us", 2300);
    } },
    { chapter: "Check-in", async run({ stage }) {
      await stage("point", "phone", "Start my first check-in", { click: true, wait: 500, fast: true });
      await stage("scene", { layout: "phone", step: [2, N], overline: "Daily check-in", title: "About a minute a day.",
        points: ["Mood, sleep, energy, skin.", "Five circles each.", "Private unless she shares it."], caption: "Her record starts here, in her own words and ratings." });
      await stage("reveal", 0);
      for (const dot of ["Mood 3 of 5", "Sleep 2 of 5", "Energy 3 of 5", "Skin 4 of 5"]) await stage("point", "phone", dot, { click: true, fast: true });
      await stage("reveal", 1);
      await stage("point", "phone", "Done", { click: true, wait: 900, fast: true });
      await stage("hideCursor");
      await stage("reveal", 2);
      await stage("spot", "phone", "first one, noted.", 1200, false);
    } },
    { chapter: "Share", async run({ stage, world, sleep }) {
      await stage("scene", { layout: "phone", step: [3, N], overline: "Share with her doctor", title: "Her PCP's office opens it with a code.", phone: "/patient/#/share",
        points: ["She picks what they see.", "The code works once, for 15 minutes.", "The office also needs her date of birth."], caption: "Every view is logged where she can see it." });
      await stage("reveal", 0);
      await stage("point", "phone", "Make my share code", { click: true, wait: 900 });
      await stage("hideCursor");
      await stage("reveal", 1);
      const code = (await world()).shareCodes.at(-1)?.code ?? "";
      await stage("controls", `/pcp/#/lookup/${code}`, []);
      await stage("ctlFill", "#dob", DOB);
      await stage("controls", `/pcp/#/lookup/${code}`, ["Open her record"]);
      await stage("reveal", 2);
      await stage("waitFor", "phone", "opened your record");
      await stage("spot", "phone", "opened your record", 1800);
    } },
    { chapter: "Preferences", async run({ stage }) {
      await stage("scene", { layout: "phone", step: [4, N], overline: "Waitlist preferences", title: "She sets what works for her.", phone: "/patient/#/waitlist",
        points: ["Distance, or telehealth.", "Days and times.", "The shortest notice she can take."], caption: "Attune never promises a date or a place in line." });
      await stage("reveal", 0);
      await stage("choose", "phone", "#miles", 10);
      await stage("reveal", 1);
      await stage("point", "phone", "Evenings", { click: true, fast: true });
      await stage("reveal", 2);
      await stage("point", "phone", "Save preferences", { click: true, wait: 700 });
      await stage("hideCursor");
    } },
    { chapter: "Her record", async run({ stage }) {
      await stage("scene", { layout: "phone", step: [5, N], overline: "Her record, her rules", title: "She sees who looked, and decides what they see.", phone: "/patient/#/record",
        points: ["Every view is logged.", "Sharing is per section, per office."], caption: "Turning a section off stops future sharing with that office." });
      await stage("reveal", 0);
      await stage("waitFor", "phone", "opened your");
      await stage("spot", "phone", "opened your", 1800, false);
      await stage("go", "phone", "/patient/#/care");
      await stage("reveal", 1);
      await stage("point", "phone", "Medications", { click: true, wait: 300 });
      await stage("hideCursor");
      await stage("waitFor", "phone", "Stopped sharing", 4000);
      await stage("spot", "phone", "Medications", 1300, false);
    } },
    { chapter: "Recap", async run({ stage, sleep }) {
      await stage("card", { kicker: "What you saw", big: "Her first minutes in Attune", lines: ["Three questions and a one-minute check-in", "A share code her PCP's office opens with her date of birth", "Waitlist preferences she controls", "A log of who looked, and sharing she can switch off"], meta: "Attune prototype · synthetic data" });
      await sleep(3800);
    } },
  ],
};
