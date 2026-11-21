# Demo videos

Three one-minute videos of the Attune prototype, recorded from the live production build with synthetic data:

| File | What it shows |
| --- | --- |
| `out/attune-1-referral-loop.mp4` | A ready patient on the waitlist, a cancellation, the offer and acceptance, the Patient Pack, the visit summary closing the loop, and the fee ledger |
| `out/attune-2-ai-assistant.mp4` | Connecting her own AI assistant section by section, journaling in it, the suggestions she applies in Attune, asking about her record, and switching labs off |
| `out/attune-3-patient-experience.mp4` | Onboarding, the first check-in, sharing with her PCP by code, waitlist preferences, and who viewed her record |

Each MP4 is 1920×1080, 30 fps H.264 with fast start, so it plays in a browser, Slides, Keynote or a chat app. Each
has chapter markers (QuickTime and VLC show them) and a `-poster.png` thumbnail. Every film opens with a title card
and ends with a "what you saw" recap.

```bash
npm run demo:video                                       # build, then record all three (about 4 minutes)
npm run build && node scripts/demo-video/record.mjs --film ai     # just one: referral | ai | patient
```

Needs Google Chrome (set `CHROME_PATH` if it isn't in /Applications) and `ffmpeg` with libx264. The recorder
starts its own static server and the connector gateway, resets the demo world for each film, drives the app
through `stage.html` (frames, titles, captions, cursor, highlights, progress), captures frames over the Chrome
DevTools protocol, and encodes them. It prints any step that didn't find its target; a clean run says
`problems: none`.

| File | What it is |
| --- | --- |
| `record.mjs` | Servers, Chrome, frame capture, encoding, chapters |
| `films/*.mjs` | The three scripts. Edit captions, steps and timing here |
| `stage.html`, `stage.js` | The recording stage |

Honesty rules:

- Attune has no chatbot. In the AI video, the assistant panel is a **scripted demo client**, labelled on screen.
  It stands in for Claude so the video is reproducible. Its calls to Attune's connector are real, and its answers
  are built from what the connector returned. It is not styled as Claude or ChatGPT.
- Everything shown is synthetic.

Output (`out/`) is generated and git-ignored. Re-record after UI changes.
