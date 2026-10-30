# Release evidence

`release/acceptance.json` is created when a build is promoted. `scripts/check_promotion.py` reads it on every PR into
`stage` or `main` and fails closed when evidence is missing. Template: `templates/acceptance.template.json` on `meta`.
The matching human-readable report lives in `releases/` on `meta`.
