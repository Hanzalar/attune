## Change

- **Change ID:** `<kebab-case-id>` (same ID as `openspec/changes/<id>/` on `meta`)
- **Spec:** https://github.com/Hanzalar/attune/tree/meta/openspec/changes/<id>
- **Discovery evidence:** link to the note on the `business` branch this builds on

## What changed

-

## Verification (paste real output, not a summary)

```
npm run check
```

- [ ] Walked the loop across the patient, PCP and specialist views (or explain why not needed)
- [ ] `handoff.md` on `meta` updated with branch, SHA, evidence and next action
- [ ] No real patient data, names, or secrets in code, fixtures, screenshots or logs
- [ ] Ranking, consent and sign-off rules untouched, or changed with tests and an ADR
