# Demo video tooling

Builds `out/mabarint-demo.mp4` (1280×720, about 2:20). The video is a scripted recording of the live site with a synthetic voice-over (Windows "Microsoft Mark" voice).

1. `narration.json` holds the six voice-over segments, the same text as [docs/demo-video-script.md](../../docs/demo-video-script.md).
2. `tts.ps1` renders each segment to `out/audio/*.wav` with a Windows OneCore voice:
   `powershell -ExecutionPolicy Bypass -File tts.ps1 -Voice Mark`
3. `record.mjs` drives Chromium through the site with Playwright. Each scene is paced to the length of its segment, and a visible cursor is drawn on screen. The script then mixes the voice into the capture with ffmpeg:
   `npm install && npx playwright install chromium && node record.mjs`

The Playground scene runs Muse Spark live. Each run is saved in the public *Recent readings*, and a second run of the same text is served from the server cache (the step then reads "Found it among recent readings"). Change `LIVE_TEXT` in `record.mjs` before recording again.

To use your own voice, record over `out/raw/capture.webm` and follow the same segment timing.
