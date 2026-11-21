# Design

- **Branch:** orphan `landing` (worktree `../attune-landing`). Static files, no build step.
- **Layout:** `index.html` at the root; every other file under `site/` so the overlay never touches the app's
  `assets/`, `favicon.svg`, `manifest.webmanifest` or view folders. App links are relative (`demo/`, `patient/`,
  `pcp/`, `specialist/`, `guide/`).
- **Design:** `site/tokens.css` mirrors `apps/web/src/design/tokens.ts` on develop (orphan branches cannot share
  files; update both together). IBM Plex Sans 400/500/600 and Mono 400/500 woff2 with the OFL text.
- **Deploy:** `pages.yml` on develop checks out `landing` into `.landing`, refuses any path clash, copies
  `index.html` and `site/` into `apps/web/dist`. `landing.yml` on the branch runs `gh workflow run pages.yml --ref
  develop` on push.
