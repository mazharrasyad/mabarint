# Project Brief — Mabarint (working name)

> **"Authors write plain text. Readers hear the voice."**
> A library + API that uses Meta's models to read the context of plain text and automatically add *tajwid-like* notation for mabarinttion and emotion, so any digital text platform (novels, news, stories, scripts) can show readers *how* a passage should be read.

This document is the full build brief for a coding agent. Follow it in order. Where something is marked **VERIFY**, check the official docs before implementing.

---

## 0. Context: Hackathon constraints (must respect)

- **Event:** Meta Global AI Developer Hackathon (Cerebral Valley), remote.
- **Track:** Indie Developer (solo builder).
- **Problem statement:** *Build for Your World*.
- **Submission deadline:** Wed Nov 4, 2026, 9:00 PM ET (= Thu Nov 5, 09:00 WIB). Target finishing by Nov 4 WIB.
- **Rules:**
  - Repository **must be public**.
  - **New work only** — everything must be built during the event (Oct 27 – Nov 4). Commit often so history proves this.
  - Project **must use Meta models** (Meta Model API and/or Meta open-weight models).
  - Do not use code, data or assets we don't have rights to. **Use only public-domain texts (e.g., Project Gutenberg) or self-written texts in demos.** No copyrighted novels or real news articles copied in full.
- **Anti-projects to avoid in framing:** basic RAG, simple text/image analyzers, simple "AI for education" chatbots, medical advice, anything political or involving war. → Frame Mabarint as **a new reading format / rendering infrastructure**, NOT an analyzer or chatbot. The `news` profile must **refuse political/war content**.

### Judging rubric (design every decision around this)

| Criterion | Weight | How Mabarint scores |
|---|---|---|
| Impact | 30% | Plain text loses tone/emotion; Mabarint restores it for any platform, zero effort for authors. Clear users: readers, EFL learners, accessibility, read-aloud users. |
| Use of Meta AI tooling | 25% | Muse Spark does deep context reasoning (speaker, subtext, sarcasm, scene mood) → structured annotations, plus per-word "why" explanations. Optional: Muse Spark Open via partner inference. |
| Demo | 25% | Side-by-side plain vs annotated; "one sentence, many meanings" moment; live playground. |
| Technical depth | 20% | Open annotation schema, verifiable agent loop (validate + repair), caching, renderer library with variable fonts. |

---

## 1. Product concept

### Core idea
- Authors write **plain text** as usual. They never touch notation.
- A platform installs the Mabarint library.
- Mabarint's engine (Muse Spark) reads context and produces **annotations** (stress, elongation, pitch, pause, tempo, volume, emotion).
- The renderer displays them to readers as subtle visual notation, like tajwid marks in Qur'anic text.

### What the AI reads (context cues in plain text)
- Dialogue tags: *she whispered*, *he snapped* → volume/tone.
- Punctuation: `...`, `?!`, em dashes → pauses, rising pitch, surprise.
- Repetition: *"No. No. No."* → escalating stress.
- Contrast: *"I didn't say **she** stole it"* → contrastive stress.
- Scene mood from preceding paragraphs (funeral, celebration).
- Relationships between characters → sarcasm vs sincerity.
- Body descriptions: *her voice cracked* → sadness, slow tempo, pauses.
- Discourse words: *finally*, *suddenly* → emphasis/tempo change.

### Differentiator vs existing tools
- BeeLine Reader (color gradients) only helps eye-tracking; it adds no meaning.
- Speech-modulated typography research (Pataca & Costa, 2022) maps **audio → typography** for captions.
- **Mabarint goes text → AI-inferred prosody → typography**, for silent reading, on any platform. It adds *meaning*.

---

## 2. Architecture (3 layers)

```
Plain text ──► [1] Annotation Engine (Muse Spark) ──► [2] Mabarint JSON (open format) ──► [3] Renderer (JS lib) ──► Reader
```

### Layer 1 — Annotation Engine (backend)
- Endpoint: `POST /api/annotate`
- Input:
  ```json
  { "text": "string", "profile": "novel|news|script", "lang": "en", "context": "optional preceding text" }
  ```
- Output: Mabarint JSON (see §3).
- Pipeline:
  1. **Segment** text into paragraphs and sentences (keep original character offsets).
  2. **Analyze** each paragraph with Muse Spark, passing previous paragraph(s) as context.
  3. **Annotate**: Muse Spark returns structured JSON spans.
  4. **Validate** (verifiable agent loop):
     - JSON parses and matches schema.
     - Offsets are within bounds and `text.slice(start,end)` matches the `quote` field returned by the model.
     - Density limits: max ~1 stress per 6 words, max 1 emotion span per utterance.
     - If validation fails → send errors back to the model and ask it to repair (max 2 retries). If still failing → drop invalid spans.
  5. **Cache** result by `sha256(text + profile + lang + schemaVersion)`.
- Profiles:
  - `novel`: full emotion on dialogue and narration.
  - `news`: emotion **only** inside quotations from sources; reporter narration stays neutral (tempo/pause only). Refuse political/war content with a clear message.
  - `script`: emphasize tempo and pauses (for read-aloud).

### Layer 2 — Mabarint JSON format (the "tajwid rules")
Offset-based, so the original text is never modified. See §3.

### Layer 3 — Renderer (frontend library)
- TypeScript, zero heavy dependencies, distributed as an ES module + a single `<script>` build.
- Usage:
  ```html
  <script src="https://<host>/mabarint.js"></script>
  <div data-mabarint="novel">Plain text here...</div>
  ```
  or
  ```ts
  import { render } from "mabarint";
  render(element, annotations, { intensity: "full" });
  ```
- Converts spans to nested `<span data-*>` elements + CSS.
- Uses a **variable font** (e.g., Recursive or Inter from Google Fonts) for smooth weight changes.
- Controls: intensity toggle (Off / Subtle / Full), legend panel, tooltip per annotated word showing the AI's short reason.

---

## 3. Annotation schema (v0.1)

```json
{
  "version": "0.1",
  "profile": "novel",
  "lang": "en",
  "tone": "sad",
  "spans": [
    { "type": "utterance", "start": 0, "end": 42, "quote": "...", "speaker": "Maria", "emotion": "sadness", "intensity": 0.8, "reason": "Reacting to news of death" },
    { "type": "stress", "start": 20, "end": 24, "quote": "fine", "level": 2, "reason": "Contrasts with reality" },
    { "type": "elongate", "start": 10, "end": 12, "quote": "No", "level": 1 },
    { "type": "pause", "start": 13, "end": 13, "length": "long" },
    { "type": "pitch", "start": 30, "end": 42, "quote": "...", "contour": "fall" },
    { "type": "tempo", "start": 0, "end": 42, "quote": "...", "rate": "slow" },
    { "type": "volume", "start": 0, "end": 12, "quote": "...", "level": "whisper" }
  ]
}
```

Field rules:
- `type`: `utterance | stress | elongate | pause | pitch | tempo | volume`
- `emotion` (8 classes only): `neutral | joy | sadness | anger | fear | surprise | tenderness | sarcasm`
- `level` for stress/elongate: `1 | 2 | 3`
- `length` for pause: `short | long`
- `contour` for pitch: `rise | fall | rise-fall`
- `rate` for tempo: `slow | normal | fast`
- `level` for volume: `whisper | soft | normal | loud | shout`
- `intensity`: 0.0 – 1.0
- `reason`: optional, ≤ 15 words, shown in tooltip.
- `quote`: exact substring at `[start, end)` — used for validation.

Deliverable: `schema/mabarint.schema.json` (JSON Schema) + TypeScript types generated from it.

---

## 4. Visual notation (renderer mapping)

| Dimension | Visual | CSS approach |
|---|---|---|
| Stress | Heavier weight | `font-variation-settings: "wght"` 500 / 650 / 800 by level |
| Elongation (mad) | Wider letter spacing | `letter-spacing` 0.08em / 0.15em / 0.25em |
| Pitch | Slight baseline shift on final syllable + small ↗ ↘ glyph | `vertical-align` / `transform: translateY` ±0.15em |
| Pause | Visible gap + marker `‧` (short) or `‖` (long) | inline-block spacer, muted color |
| Tempo | Word spacing tighter/looser | `word-spacing` -0.05em / +0.25em |
| Volume | Whisper = lower opacity; loud/shout = slightly larger | `opacity` 0.55 / `font-size` 1.08em |
| Emotion | Soft colored underline across utterance + tooltip icon | `text-decoration` color per emotion, thickness 2px, offset 3px |

Emotion color palette (accessible, soft):
- neutral: none · joy: amber · sadness: blue · anger: red · fear: purple · surprise: teal · tenderness: pink · sarcasm: dashed gray (style, not just color)

Intensity modes:
- **Off**: plain text.
- **Subtle**: stress + pause only.
- **Full**: all dimensions.

Accessibility:
- Never rely on color alone (sarcasm uses dashed style; tooltip text describes emotion).
- Respect `prefers-reduced-motion` (no animation by default).
- Works in dark mode.

---

## 5. Muse Spark prompt (engine)

**VERIFY:** exact model ID, endpoint format, and whether structured/JSON output mode is supported in the Meta Model API docs (Quickstart + Model list). If JSON mode exists, use it.

System prompt draft:

```
You are Mabarint, an expert narrator and prosody annotator. Given a passage of plain text, infer how a skilled human narrator would read it aloud, using only cues present in the text and its context: dialogue tags, punctuation, repetition, contrast, scene mood, character relationships, physical descriptions, and word choice.

Return ONLY JSON matching the Mabarint v0.1 schema. Rules:
- Every span must include "start", "end" (character offsets into the PASSAGE) and "quote" (the exact substring).
- Be sparse: annotate only what a careful narrator would genuinely mark. At most one stress per ~6 words.
- Use exactly one of 8 emotions: neutral, joy, sadness, anger, fear, surprise, tenderness, sarcasm.
- Add a short "reason" (<= 15 words) for stress and utterance spans.
- Profile "news": annotate emotion ONLY inside quotations from sources; keep reporter narration neutral (tempo/pause only). If the passage is political or about war, return {"refused": true, "reason": "..."}.
- Profile "script": prioritize pauses and tempo.
- Never rewrite, add or remove words.
```

User message template:

```
PROFILE: {profile}
LANG: {lang}
PRECEDING CONTEXT (do not annotate): {context}
PASSAGE (annotate this):
{text}
```

Repair message template (on validation failure):

```
Your previous JSON had these errors: {errors}. Return corrected JSON only.
```

Implementation note: LLMs are often imprecise with character offsets. Strategy: ask the model for `quote` + approximate offsets, then **recompute offsets server-side** by searching for `quote` within the sentence near the approximate position. Treat this as part of the validation layer.

---

## 6. Demo site (what judges see)

Pages:
1. **Home / Pitch**: tagline, 10-second side-by-side (plain vs Mabarint), "How it works" diagram, install snippet.
2. **Novel demo**: public-domain excerpt (e.g., *Alice's Adventures in Wonderland* or *Pride and Prejudice*), with toggle Off/Subtle/Full.
3. **News demo**: self-written sample articles (one joyful, one sorrowful), showing quotes annotated while narration stays neutral.
4. **"One sentence, many meanings"**: the sentence *"I didn't say she stole it."* in 4–5 different short contexts; Mabarint places stress differently each time and explains why. **This is the key "wow" moment for the video.**
5. **Playground**: paste text (max ~1,000 chars), pick profile, see live result + raw JSON tab.
6. **Docs**: schema, renderer API, integration snippet.

Pre-computed results:
- Demo pages 2–4 load **pre-computed JSON** from `/demo-data/*.json` (no API call → fast, reliable, zero cost).
- Script `scripts/precompute.ts` generates these using the real engine (commit the outputs).

---

## 7. Deployment & security

- Host: Vercel (or own VPS).
- `META_API_KEY` only in server environment variables. **Never** in frontend code or the repo. Add `.env.example`.
- Playground protections: max input length, rate limit per IP (e.g., 10 requests / 10 min), cache, request timeout.
- Spend limit set in Meta billing (manual step, already noted).
- Graceful errors: if the API fails, show a friendly message and suggest trying a demo page.

---

## 8. Suggested tech stack & repo structure

- Next.js (App Router) + TypeScript for site + API route, or Vite frontend + small Node/Hono API.
- Renderer as a separate package inside a monorepo (pnpm workspaces).

```
mabarint/
├─ README.md
├─ LICENSE                      (MIT)
├─ .env.example
├─ schema/
│  └─ mabarint.schema.json
├─ packages/
│  ├─ engine/                   (segment, prompt, call Meta API, validate, repair, cache)
│  │  ├─ src/
│  │  └─ tests/
│  └─ renderer/                 (TS library → ESM + UMD build)
│     ├─ src/
│     └─ tests/
├─ apps/
│  └─ web/                      (demo site + /api/annotate)
│     ├─ app/
│     └─ public/demo-data/
├─ scripts/
│  └─ precompute.ts
└─ docs/
   ├─ architecture.md
   └─ notation.md
```

---

## 9. Milestones & checklist

### Day 1 — Oct 28 (tonight)
- [ ] Create public GitHub repo with structure above, MIT license, initial README.
- [ ] First successful call to Meta Model API (Muse Spark) from `packages/engine`. **VERIFY** model ID.
- [ ] Commit `schema/mabarint.schema.json` v0.1.

### Days 2–3 — Oct 29–30: Engine
- [ ] Sentence/paragraph segmentation with offsets.
- [ ] Prompt + JSON output parsing.
- [ ] Validation + offset recomputation + repair loop.
- [ ] Profiles: novel, news (with refusal), script.
- [ ] Cache (in-memory + file/KV).
- [ ] Unit tests on 10+ sample passages.

### Days 4–5 — Oct 31–Nov 1: Renderer
- [ ] Spans → nested HTML (handle overlapping spans safely).
- [ ] CSS for all 7 dimensions + 8 emotions, light/dark.
- [ ] Intensity modes, legend, tooltips with reasons.
- [ ] `<script>` auto-init via `data-mabarint` attribute.

### Day 6 — Nov 2: Demo site
- [ ] Home, Novel, News, One-sentence-many-meanings, Playground, Docs pages.
- [ ] Precompute demo data with the real engine.
- [ ] Deploy; rate limiting on playground.

### Day 7 — Nov 3: Polish
- [ ] README complete (see §10).
- [ ] Test on mobile and desktop; fix edge cases.
- [ ] Draft all submission text fields.

### Day 8 — Nov 4: Ship
- [ ] Record 3-minute demo video (see §11); upload (YouTube unlisted / Loom); test link in incognito.
- [ ] Post demo on X (for Most Viral bonus); copy post link.
- [ ] Submit form; double-check repo is public and all links open in incognito.

### Stretch goals (only if MVP is done)
- [ ] Chrome extension applying Mabarint to any webpage.
- [ ] Run engine on **Muse Spark Open** via Baseten (model `meta-models/muse-spark-open-1026`) or Modal → eligible for "Best Build on Meta Open Weight Models" bonus.
- [ ] Author review mode: author can override an annotation.
- [ ] Voice mode: author reads a passage; capture timing via Muse Voice Transcribe (+ pitch via Web Audio) and convert to Mabarint spans. **VERIFY** what Voice Transcribe returns.
- [ ] Indonesian language support.

---

## 10. README outline

1. Title + tagline + demo GIF/screenshot (plain vs Mabarint).
2. Problem: plain text loses mabarinttion and emotion; authors are limited to bold/italic.
3. Solution: AI reads context → tajwid-like notation; zero effort for authors.
4. Live demo link + video link.
5. How it works (3-layer diagram).
6. Use of Meta models (Muse Spark: what and why; optional open-weights).
7. Notation guide (table from §4).
8. Quick start: install renderer, call API, run locally.
9. Schema reference.
10. Built during the hackathon (Oct 27 – Nov 4, 2026) — list of what was created.
11. Limitations & future work.
12. License.

---

## 11. Demo video script (3:00 max)

| Time | Content |
|---|---|
| 0:00–0:20 | Hook: show a plain sentence, ask "How should this be read?" Problem statement. |
| 0:20–0:50 | "One sentence, many meanings" — same sentence, different contexts, Mabarint shifts stress and explains why. |
| 0:50–1:40 | Novel demo: toggle Off → Subtle → Full; hover tooltips showing Muse Spark's reasoning. |
| 1:40–2:10 | News demo: quotes carry emotion, narration stays neutral; refusal on political content (brief). |
| 2:10–2:35 | Developer view: one `<script>` tag integration + JSON format; playground live run. |
| 2:35–3:00 | How Meta models power it (Muse Spark reasoning + validation loop), impact, call to action. |

Only show features built during the hackathon.

---

## 12. Submission form — field drafts (fill in at the end)

- **Team Name:** Mabarint (or final name)
- **Track:** Indie Developer
- **Problem statement:** Build for Your World
- **X post link:** (after posting demo)
- **Project Description:** Problem → solution → key features → how it works. Include live demo link.
- **Public GitHub Repository:** (repo URL)
- **3-Minute Demo Video:** (video URL)
- **Describe your use of Meta products:** Muse Spark for context reasoning and structured prosody annotation (speaker detection, subtext, sarcasm, scene mood) with a validate-and-repair agent loop; per-word reasoning surfaced to readers; Muse Code used to accelerate development (if used); Muse Spark Open via Baseten/Modal (if done).
- **Why are Meta's models important:** The task needs deep narrative understanding (who speaks, relationships, irony, contrast) across long context, plus reliable structured output at low latency — exactly Muse Spark's multimodal reasoning strengths; open weights allow platforms to self-host for privacy and cost.
- **Feedback (Meta / partners):** honest notes collected during development.

---

## 13. Definition of done (MVP)

- [ ] `POST /api/annotate` returns valid Mabarint JSON for novel, news, and script profiles.
- [ ] Renderer displays all 7 dimensions with Off/Subtle/Full modes and tooltips.
- [ ] Demo site deployed with 4 demo pages (pre-computed) + working playground.
- [ ] README, schema docs, MIT license, `.env.example`; no secrets in repo.
- [ ] 3-minute video uploaded and form submitted before the deadline.
