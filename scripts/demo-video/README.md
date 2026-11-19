# Demo video

Records the Attune demo as a 1920×1080, 30 fps H.264 MP4 from the live production build, using synthetic data.
It covers the handoff's six-step cancellation fill, then the AI journal, Ask and the MCP connector.

```bash
npm run demo:video          # builds the app, then records to scripts/demo-video/out/
```

Needs Google Chrome (set `CHROME_PATH` if it isn't in /Applications) and `ffmpeg` with libx264. The recorder
starts its own static server and the assistant gateway, drives the app through `stage.html` (the frame, titles,
captions, cursor and highlights), captures frames over the Chrome DevTools protocol, and encodes them. The run
takes about three minutes.

| File | What it is |
| --- | --- |
| `record.mjs` | Servers, Chrome, frame capture, encoding |
| `scenes.mjs` | The script, scene by scene. Edit captions and timing here |
| `stage.html` | The recording stage: desktop and phone frames, captions, cursor, highlights |

Honesty rules for the video:

- Without Claude credentials, the AI scenes use **demo replies (no AI model)**. Captions say so, and so does
  the app on screen.
- The connector scene shows Attune's own connector test client calling through Claude's connection. It is
  labelled as such and is never presented as Claude.
- Everything shown is synthetic.

Output (`out/`) is generated and git-ignored. Re-record after UI changes.
