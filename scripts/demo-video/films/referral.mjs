/** Video 1: the referral loop, from a ready patient to a closed referral and one fee that isn't billed. */
const PCP = "PCP portal · Cedar Family Medicine (example)";
const SPEC = "Specialist portal · Bluebonnet Endocrinology (example)";
const OPS = "Attune operations (mocked)";
const N = 6;

export default {
  slug: "1-referral-loop",
  title: "Attune · The referral loop",
  world: "Start at the fill",
  speed: "10×",
  scenes: [
    { chapter: "Title", async run({ stage, sleep }) {
      await stage("card", { kicker: "Attune · Video 1 of 3", big: "The referral loop", sub: "A specialist's cancellation, filled by a patient who is already ready.", meta: "About one minute · Prototype · synthetic data" });
      await stage("go", "desktop", "/pcp/#/board", PCP);
      await stage("go", "phone", "/patient/#/");
      await sleep(1900);
    } },
    { chapter: "Ready", async run({ stage, sleep }) {
      await stage("scene", { layout: "split", step: [1, N], overline: "Before anything opens", title: "Ari is ready, and waiting.", dlabel: PCP, desktop: "/pcp/#/board", phone: "/patient/#/",
        caption: "Her PCP signed the referral. Attune checked it against the practice's criteria and her insurance." });
      await stage("uncard");
      await sleep(400);
      await stage("spot", "desktop", "Ari Lindqvist", 1900);
      await stage("spot", "phone", "On waitlist", 1500);
    } },
    { chapter: "A cancellation", async run({ stage }) {
      await stage("scene", { layout: "split", step: [2, N], overline: "A cancellation", title: "The endo office posts an opening.", dlabel: SPEC, desktop: "/specialist/#/openings",
        caption: "The front desk never sees who is waiting. Attune offers the slot to the best-fit ready patient." });
      await stage("spot", "desktop", "Starts in", 1800, false);
      await stage("point", "desktop", "Post opening", { click: true, wait: 1400 });
      await stage("hideCursor");
    } },
    { chapter: "The offer", async run({ stage }) {
      await stage("scene", { layout: "split", step: [3, N], overline: "The offer", title: "Ari accepts while the hold runs.",
        caption: "Accepting is her consent to share her Patient Pack. The practice sees nothing about her before that." });
      await stage("waitFor", "phone", "A time opened up for you");
      await stage("spot", "phone", "A time opened up for you", 1600);
      await stage("point", "phone", "Accept this time", { click: true, wait: 1400 });
      await stage("hideCursor");
      await stage("spot", "desktop", "Ari Lindqvist", 1600);
    } },
    { chapter: "No retelling", async run({ stage, sleep }) {
      await stage("scene", { layout: "split", step: [4, N], overline: "No retelling", title: "The front desk opens her Patient Pack.",
        caption: "Her story, the PCP's note, labs, trends and medications, each with its source. Opening it is logged." });
      await stage("point", "desktop", "Open Patient Pack", { click: true, wait: 900 });
      await stage("hideCursor");
      await stage("scroll", "desktop", "PCP referral note", 1700);
      await sleep(500);
      await stage("scroll", "desktop", "Labs and results", 1500);
      await sleep(900);
    } },
    { chapter: "The visit", async run({ stage }) {
      await stage("controls", "/demo/", ["Skip to the booked visit"]);
      await stage("scene", { layout: "split", step: [5, N], overline: "After the visit", title: "A summary closes the loop.", dlabel: SPEC, desktop: "/specialist/#/openings",
        caption: "The summary lands in Ari's record and her PCP's inbox, and the referral closes." });
      await stage("point", "desktop", "Mark attended", { click: true, wait: 700 });
      await stage("point", "desktop", "Upload visit summary", { click: true, wait: 800 });
      await stage("type", "desktop", "css:textarea", "Reviewed history and results together. Plan agreed; follow up in 8 weeks.", 55);
      await stage("point", "desktop", "Send summary", { click: true, wait: 700 });
      await stage("hideCursor");
      await stage("go", "desktop", "/pcp/#/inbox", PCP);
      await stage("go", "phone", "/patient/#/");
      await stage("waitFor", "desktop", "Reviewed history");
      await stage("spot", "desktop", "Reviewed history", 1600);
      await stage("waitFor", "phone", "Your summary arrived");
      await stage("spot", "phone", "Your summary arrived", 1500);
    } },
    { chapter: "Who pays", async run({ stage }) {
      await stage("scene", { layout: "desktop", step: [6, N], overline: "Who pays", title: "One fee, owed by the endo practice.", dlabel: OPS, desktop: "/ops/#ledger",
        caption: "Nothing is billed in the prototype. PCPs and patients never pay for the referral loop." });
      await stage("spot", "desktop", "Bluebonnet Endocrinology (example)", 1600);
      await stage("spot", "desktop", "Never charged for the referral loop", 1300);
    } },
    { chapter: "Recap", async run({ stage, sleep }) {
      await stage("card", { kicker: "What you saw", big: "The referral loop", lines: ["Only ready patients get offers: signed, complete, insurance-checked", "First to accept wins, and accepting is her consent", "Her Patient Pack instead of a retold story", "A summary closes the loop; one fee, nothing billed"], meta: "Attune prototype · synthetic data" });
      await sleep(3800);
    } },
  ],
};
