# Why
Patients, PCP offices and specialist offices need one public page that explains Attune in their own terms and leads
them into the demo. Discovery shows each side breaks at a different point of the handoff (`business` branch,
`discovery/referral-gap.md`), so the page speaks to each side separately.

# What Changes
- New orphan branch `landing` with a static page (`index.html`, `site/`): hero, where referrals break today, three
  audience views (patients, PCP offices, specialists) as accessible tabs with hash links, the rules Attune follows,
  and an honest status notice.
- Same design system as the app (tokens mirrored in `site/tokens.css`, self-hosted Plex, the Attune mark). No external
  requests, no analytics, no forms.
- develop's Pages workflow overlays the branch on the site root and fails on path clashes; a push to `landing`
  re-runs that workflow.
- Constitution amended to a fourth branch kind.

# Capabilities
## New Capabilities
- `landing`: public page for the three audiences.

# Impact
New branch `landing`; `.github/workflows/pages.yml` on develop (shipped on `feature/clinical-redesign`, which also
moves the demo hub to `/demo/`); `governance/constitution.md` on meta.
Excluded: pricing, compliance or FDA claims, testimonials, contact form or email (no backend, no approved address).
Regulatory gates: the page claims only what the demo does; no specialist-paid model is mentioned (attorney review
pending).
