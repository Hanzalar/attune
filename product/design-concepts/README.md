# Design concepts

*2026-11-18 · Boards that came with the [prototype handoff](../prototype-handoff.md). Concepts, not specs. The prototype takes its look from them and nothing else unless the handoff says so.*

| Board | What it shows | Used in the prototype |
| --- | --- | --- |
| [her-morning.png](her-morning.png) | "A minute a day, just for her." Onboarding (three questions, pick up to three), a note that proves we listened, the check-in in her own ink, and a finite Today page that ends with "you're caught up." | Yes: onboarding, check-in, the finite Home, the look (Bloom washes, torn paper, serif-italic voice, Forest buttons). **Not** the daily note, the "probably luteal" phase guess or the "Ideas for today" suggestions: those are out of scope, and a phase guess plus "ask your doctor: add magnesium" would break the no-diagnosis, no-treatment rule. |
| [pro-and-shop.png](pro-and-shop.png) | A paid tier: Expert Hour, an ask-the-expert line, vetted doctors and a partner shop. Revenue from subscriptions, a per-booking doctor fee and a shop revenue share. | No. Out of scope for the prototype. |
| [circles.png](circles.png) | Community: rooms, replies with "me too," sharing a stamp or a sleep line to a post, and a flower-name alias or a public profile. | No. Community features are out of scope. The "only what you pick leaves your log" sharing pattern matches our consent model, though. |

## Before these boards go further

- **Working name.** The boards say "meye." The product is **Attune**, and the code keeps the name in one constant (`PRODUCT_NAME`).
- **A real physician is named.** The Expert Hour board uses a real reproductive endocrinologist's name and affiliation as sample content. The repo is public, and a named, real clinician on a product board can read as an endorsement we don't have. Swap in a placeholder before this branch is pushed or the board is shown outside the team, unless we have their written permission.
- **The shop and the doctor fee need counsel.** "A flat fee when a doctor books a new member" is the per-booking model ADR-004 rejects pending attorney review (OIG AO 26-15, Tex. Occ. Code 102.001). A partner shop selling supplements next to clinical content raises FTC endorsement and product-claim questions. "Doctors cannot pay to rank higher" matches ADR-003.
- **Florals are drawn in code.** In the build they're CSS gradients and SVG grain; no photography or stock imagery.
