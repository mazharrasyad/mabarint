# Architecture

```
Plain text ──► Engine (packages/engine) ──► Mabarint JSON (schema/) ──► Renderer (packages/renderer) ──► Reader
```

## Engine (`packages/engine`)

`createEngine(config).annotate({ text, profile, lang, context, onProgress })`

1. **Cache lookup.** The key is SHA-256 of text, profile, lang, context, schema version, model, reasoning effort and system prompt.
2. **Segment** (`segment.ts`): paragraphs keep their offsets into the full input.
3. **Annotate** each paragraph with Muse Spark (`prompt.ts`, JSON mode). Paragraphs run in parallel (default 3). Each one receives the caller's context plus up to 1,200 characters of the text before it.
4. **Validate** (`validate.ts`):
   - Every span's `quote` is located in the passage. The model's `start` only chooses between repeated occurrences, and matching tolerates curly vs straight quotes and case.
   - A pause's quote is the text *before* the pause, so the pause is placed at the end of that text.
   - Enum fields are checked, `intensity` is clamped and `reason` is cut to 15 words.
   - Rules: about 1 stress per 6 words in each sentence (the lowest levels are dropped first), at most 3 words per stress, and one emotion per utterance. In the news profile, only tempo and pause are allowed outside quotation marks.
5. **Repair:** if there are errors, the model's own answer and the error list go back as a new turn, up to `maxRepairs` (2). The engine keeps the best attempt, judged first by fewest errors and then by most valid spans. Spans that still fail are dropped and counted in `meta.dropped`.
6. **Merge:** paragraph offsets are shifted back into the full text, and the tone is decided by majority vote.

Progress events (`segment`, `model`, `validate`, `repair`, `merge`, `done`) are streamed to the playground as server-sent events.

## Renderer (`packages/renderer`)

`layout(text, spans)` is a pure function. It cuts the text at every span boundary, so each run carries the classes of all the spans that cover it. Overlapping spans never need nested or crossing elements. Pause and pitch marks are inserted as `aria-hidden` glyph elements. `render()` writes the runs into the DOM. CSS switches by `data-mbr-intensity`: `off` shows the plain text (Plain), `full` shows all notation (Mabarint).

## Demo site (`apps/web`)

Next.js App Router with `basePath: /mabarint`, built as standalone output and run in Docker behind nginx. The demo pages import precomputed JSON from `public/demo-data`, which `scripts/precompute.ts` generates with the real engine at `medium` effort. `POST /api/annotate` checks the kill switch, input length, the optional access code, per-IP and daily quotas, then runs the engine with a 90-second timeout.
