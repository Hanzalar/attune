# Attune: `business` branch

Why Attune exists and what we've learned. Written for the whole team, advisors and anyone we share the repo with.
No code lives here. Specs are on [`meta`](https://github.com/Hanzalar/attune/tree/meta); the product is on [`develop`](https://github.com/Hanzalar/attune/tree/develop), with a live demo at https://hanzalar.github.io/attune/.

## Start here

| Doc | What it answers |
| --- | --- |
| [product/referral-agent-solution.md](product/referral-agent-solution.md) | What we're building, for whom, and the PCP to OB/GYN loop step by step |
| [discovery/referral-gap.md](discovery/referral-gap.md) | What interviews showed on each side of the handoff |
| [research/competitive-landscape.md](research/competitive-landscape.md) | Epic, other EHRs, referral-intake vendors, records networks, standards, PMOS players |
| [strategy/integrations.md](strategy/integrations.md) | How records come in and packets go out: fax and 360X now, FHIR later |
| [strategy/pricing-and-legal.md](strategy/pricing-and-legal.md) | Who pays: three options and the kickback risk |
| [strategy/risks.md](strategy/risks.md) | What could kill it, and the test that settles each risk |
| [decisions.md](decisions.md) | Decisions we've made (ADRs) |
| [open-questions.md](open-questions.md) | What we still need to ask, grouped by who can answer |

## How to edit (no setup needed)

Open any file on GitHub, press the pencil, edit, and commit to `business`. For bigger changes, commit to a new branch and open a pull request into `business` so someone reviews it.

## Rules for this branch (the repo is public)

1. **No names of interviewees.** Use role IDs: Patient A to G, PCP-1, PCP-2, SPEC-1, OBGYN-1 to 3, Advisor (ex-Epic), Advisor (regulatory), Operator-1. The key to the IDs stays in the private Interview Journal on the team Drive.
2. **No identifying health details.** Keep stories at the level of "about 5 years and 5 gynecologists to a diagnosis", not ages, employers, cities or dates that point to one person.
3. **No raw transcripts, recordings or paid reports** (Pitchbook, BCC, journal PDFs). Summarize and link to the Drive.
4. **Every product capability links back here.** A proposal on `meta` cites the discovery note that justifies it.
5. **Decisions go in [decisions.md](decisions.md)** with the date, the decision, why, and what would change it.
