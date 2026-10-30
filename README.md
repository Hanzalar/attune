# Attune landing page

The public marketing page for Attune, at the root of https://hanzalar.github.io/attune/.

This is an **orphan branch**. It shares no history with `develop`, `meta` or `business` and never merges into
them, or they into it. It holds only the static page: no build step, no framework, no third-party requests.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | The page. Three audience views (patients, PCP offices, specialists) routed by `#patients`, `#pcp`, `#specialists`. |
| `site/tokens.css` | Attune Clinical UI tokens and self-hosted font faces. Mirrors `apps/web/src/design/tokens.ts` on `develop`; change both together. |
| `site/landing.css` | Page styles, built only from the tokens. |
| `site/landing.js` | Tab behaviour. Without it, every view stays visible. |
| `site/fonts/` | IBM Plex Sans and Mono (latin), self-hosted, with the SIL Open Font License in `OFL.txt`. |
| `site/favicon.svg` | The Attune mark. |

Everything except `index.html` lives under `site/`, so nothing collides with the app's files at the site root
(`assets/`, `favicon.svg`, `manifest.webmanifest`, `patient/`, `pcp/`, `specialist/`, `guide/`, `demo/`).
Links to the app are relative (`demo/`, `patient/`, ...), so they work under `/attune/` and locally.

## How it deploys

`develop`'s Pages workflow builds the app, checks out this branch and copies it over the site root. Pushing to
`landing` runs `.github/workflows/landing.yml`, which asks that workflow to redeploy from `develop`.

## Rules for the copy

Design follows `apps/web/DESIGN.md` on `develop`. Every claim must be true of the product as built or clearly
labelled as planned. No pricing, compliance or regulatory claims, testimonials or partner counts until they are
recorded on the `business` branch.

## Preview locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000/
```

App links (`demo/`, `patient/`, ...) only resolve on the deployed site, or when this folder is copied over a
built `apps/web/dist`.
