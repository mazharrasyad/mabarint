# Mabarint

> **Authors write plain text. Readers hear the voice.**

Mabarint is a new reading format. It uses Meta's **Muse Spark** to read the context of plain text and add subtle, *tajwid-like* notation for intonation and emotion (stress, pauses, elongation, pitch, tempo, volume and emotion), so any digital text platform (novels, news, stories, scripts) can show readers **how** a passage should be read. Authors keep writing plain text and never touch the notation.

- **Live demo:** https://mazharrasyad.tech/mabarint (open to everyone, including the live playground)
- **Demo video:** _add link_
- Built during the Meta Global AI Developer Hackathon, Oct 27 to Nov 4, 2026.

---

## The problem

Plain text loses the voice. *"I didn't say she stole it"* has six different meanings depending on which word you lean on, and on a screen all six look the same. Authors only have bold and italics, readers guess the tone, and sarcasm, grief and hesitation get lost. This affects every reader, and especially English learners, people reading aloud to children, and people who rely on read-aloud tools.

## The solution

1. **Muse Spark reads the context:** dialogue tags, punctuation, repetition, contrast, scene mood, who is talking to whom, physical cues ("her voice cracked").
2. **The engine verifies the output:** exact offsets are recomputed from quotes, the schema and reading rules are checked, and errors go back to Muse Spark for repair.
3. **The renderer adds notation** to the original text, like tajwid marks in Qur'anic script: heavier weight for stress, `‧` and `‖` for pauses, wider spacing for drawn-out words, ↗ ↘ for pitch, and a soft coloured underline for emotion. Readers switch between **Plain** and **Mabarint** and hover any mark to read *why* the AI placed it.

## How it works

```
Plain text ──► [1] Annotation engine ──► [2] Mabarint JSON ──► [3] Renderer ──► Reader
               Muse Spark + validate        open, offset-based     one <script> tag,
               and repair loop + cache      format (v0.1)          words never changed
```

| Layer | Where | What it does |
|---|---|---|
| Engine | [`packages/engine`](packages/engine) | Lets Muse Spark detect the type of text (story, news or read-aloud script) when the profile is `auto`, splits text into paragraphs (keeping offsets) and annotates them in parallel, each with the preceding text as context. It validates every span (exact quote → offsets, enums, stress density of about 1 per 6 words, one emotion per utterance, news neutrality), repairs up to 2 rounds, then drops whatever still fails. Results are cached by SHA-256. |
| Format | [`schema/mabarint.schema.json`](schema/mabarint.schema.json), [`packages/types`](packages/types) | 7 span types and 8 emotions. Offset-based, so the source text is never modified. |
| Renderer | [`packages/renderer`](packages/renderer) | Flattens overlapping spans into runs and adds CSS for all 7 dimensions in light and dark mode. Plain / Mabarint switch, accessible tooltips, a legend, and `data-mabarint` auto-init. 11 KB script. |
| Demo site | [`apps/web`](apps/web) | Next.js app with the Home, One sentence, Novel, News, Playground and Docs pages, plus `POST /api/annotate` with live progress over server-sent events. |

## Use of Meta models

- **Muse Spark (`muse-spark-1.3`) through the Meta Model API**, called with the OpenAI SDK (Chat Completions, `response_format: json_object`).
- **What Muse Spark does:** deep narrative reasoning (speaker, subtext, sarcasm vs sincerity, scene mood, contrastive focus). It returns structured spans with a reader-facing reason for each mark.
- **Verifiable agent loop:** the engine never trusts the model's offsets or format blindly. Validation errors are sent back to Muse Spark as a repair prompt, up to 2 rounds.
- **Reasoning effort as a product knob:**
  - `low` for the live playground: about 5 seconds per paragraph.
  - `medium` for the precomputed demo pages, where quality matters more than speed.

## Built with Claude Code × Meta Model API

Mabarint is a collaboration between two AI agents with clearly separate roles:

| | Role in Mabarint |
|---|---|
| **Meta Muse Spark** (`muse-spark-1.3`, Meta Model API) | **The product's brain.** Every annotation a reader sees comes from Muse Spark: the live playground, the precomputed demo pages, and the reasons in the tooltips. |
| **Claude Code** (Anthropic's terminal coding agent) | **The development partner.** It planned the monorepo, wrote the engine, renderer, demo site and tests, ran experiments against the live Muse Spark API, and deployed the app to the VPS. |

Muse Spark was also part of the development loop. Every prompt and validation change was checked against the real model before it was committed:
- Measuring `reasoning_effort` latency.
- Tuning the contrastive-stress rule until the "one sentence, many meanings" demo went from 4 of 6 to 6 of 6 correct readings.
- Confirming that the repair loop and the news refusal behave on real output.

**Meta supports this pairing directly.** The Meta Model API exposes an Anthropic-format [Messages API](https://dev.meta.ai/docs/protocols/messages) at `https://api.meta.ai`. Meta's [coding agents guide](https://dev.meta.ai/docs/coding-agents) shows how to point Claude Code at it, so Claude Code's own agent loop runs on Meta's models:

```bash
export ANTHROPIC_BASE_URL="https://api.meta.ai"
export ANTHROPIC_AUTH_TOKEN="$MODEL_API_KEY"
export ANTHROPIC_MODEL="muse-wonder-1.0"
export ANTHROPIC_DEFAULT_OPUS_MODEL="muse-wonder-1.0"
export ANTHROPIC_DEFAULT_SONNET_MODEL="muse-spark-1.3"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="muse-spark-1.3"
export CLAUDE_CODE_SUBAGENT_MODEL="muse-spark-1.3"
export ENABLE_TOOL_SEARCH="true"
claude
```

In this build, Claude Code ran on Anthropic's Claude model, and the shipped product runs entirely on Meta's Muse Spark. With the configuration above, a contributor can keep developing Mabarint in Claude Code with Muse Wonder and Muse Spark driving the agent, end to end on Meta models. Commits written with Claude Code carry a `Co-Authored-By: Claude` trailer, so the history shows what was built during the event.

## Notation guide

| Dimension | Visual |
|---|---|
| Stress | Heavier weight (3 levels) |
| Elongation | Wider letter spacing |
| Pitch | Last word shifts up or down, with a small ↗ ↘ glyph |
| Pause | `‧` short, `‖` long |
| Tempo | Looser (slow) or tighter (fast) word spacing |
| Volume | Faded for whisper/soft, larger for loud/shout |
| Emotion | Soft underline: joy amber, sadness blue, anger red, fear purple, surprise teal, tenderness pink, **sarcasm dashed grey** (never colour alone) |

Readers switch between **Plain** (the original text) and **Mabarint** (all notation).

## Quick start

```bash
npm install
cp .env.example .env        # set META_API_KEY
npm run hello               # first Muse Spark call
npm run annotate -- '"No," she whispered. "He was fine this morning."' novel
npm test                    # engine + renderer unit tests
npm run precompute          # regenerate apps/web/public/demo-data with Muse Spark
npm run dev                 # http://localhost:3200/mabarint
```

Render on any page:

```html
<script src="https://mazharrasyad.tech/mabarint/mabarint.js"></script>
<div data-mabarint data-mabarint-src="/annotations/chapter-1.json" data-mabarint-controls>Plain text…</div>
```

```ts
import { render } from "@mabarint/renderer";
render(element, annotation, { intensity: "full" });
```

## Deployment and safety

- Runs as a Docker container on a VPS behind nginx at `/mabarint` ([`Dockerfile`](Dockerfile), [`docker-compose.yml`](docker-compose.yml)).
- `META_API_KEY` lives only in the server environment.
- The demo pages use precomputed JSON, so they make **zero API calls**. Only the playground calls Muse Spark, and it is protected by:
  - a 1,000-character input limit
  - 10 requests per IP per 10 minutes
  - a daily cap
  - a cache
  - a 90-second timeout
  - a `PLAYGROUND_ENABLED` kill switch
- **Playground history:** every click on Annotate is saved on the server as one JSON line (`HISTORY_FILE`, a Docker volume in production) with the time, the text, the detected type, the result or error, and a salted hash of the IP instead of the address. Each browser keeps a random id and sees only its own runs under *Your history*; the full log is read on the server:

  ```bash
  docker exec mabarint-web-1 tail -n 20 /data/history/history.jsonl
  ```
- **Content:** novel excerpts are public domain (Lewis Carroll 1865, Jane Austen 1813). The news articles and contexts are written for this project, and their names and places are fictional.

## Built during the hackathon (Oct 27 to Nov 4, 2026)

Everything in this repository was created during the event: the annotation schema, the engine with its validate-and-repair loop, the renderer library, the demo site and API, the precompute pipeline, and the demo texts. See the commit history.

## Limitations and future work

- English only for now; Indonesian is next.
- The engine is precise with quotes but its reading is an interpretation. An **author review mode** to override marks is planned.
- Next steps:
  - Run on **Muse Spark Open** weights (Baseten/Modal) so platforms can self-host.
  - A Chrome extension that annotates any page.
  - A voice mode that derives spans from an author reading aloud.

## License

[MIT](LICENSE)

---

## Hackathon submission (form drafts)

Each block is plain text, ready to paste into the form's text fields: no Markdown and no lists, just paragraphs. Use the copy button on each block.

### Team Name
```text
Mabarint
```

### Team Members
```text
Muhammad Azhar Rasyad (mazharrasyad)
```

### Which track are you submitting to?
```text
Indie Developer
```

### Which problem statement did you build towards?
```text
Build for Your World
```

### X post link (Most Viral Track)
```text
(add after posting the demo)
```

### Project Description
```text
Plain text loses the voice. "I didn't say she stole it" means six different things depending on the stressed word, yet on a screen every reading looks the same. Authors only have bold and italics, and readers (especially language learners and people reading aloud) have to guess tone, sarcasm and emotion.

Mabarint is a new reading format: authors write plain text, and readers see how it should be read. Meta's Muse Spark reads the context of each passage (dialogue tags, punctuation, contrast, scene mood, who is speaking to whom) and returns structured prosody annotations. A verification engine recomputes offsets from exact quotes, checks the schema and reading rules, and sends errors back to Muse Spark to repair. A tiny renderer then adds tajwid-like notation to the original text on any web page: heavier weight for stress, pause marks, drawn-out spacing, pitch arrows and soft emotion underlines. Readers switch between Plain and Mabarint and can hover any mark to read the AI's reason.

The demo shows the same sentence in six different contexts, and Muse Spark moves the stress to the right word each time and explains why. Novel and news profiles show how the format adapts: in news, the people quoted carry emotion while the reporter's narration stays neutral, and political or war stories are refused. A live playground lets anyone paste their own text with no settings at all: Muse Spark first detects whether it is a story, news or a read-aloud script, and then readers watch each engine step (reading, validating, repairing) end in a clear success or error notice, and a short first-visit guide teaches readers the notation. For developers, the format is an open JSON schema and the renderer is a single script tag that works on any website.

The live demo is open to everyone with no sign-up at https://mazharrasyad.tech/mabarint
```

### Public GitHub Repository
```text
https://github.com/mazharrasyad/mabarint
```

### 3-Minute Demo Video
```text
(add link)
```

### Describe your use of Meta products to build the submitted project
```text
Muse Spark (muse-spark-1.3) through the Meta Model API is the core of Mabarint's annotation engine. We call it with the OpenAI-compatible Chat Completions endpoint in JSON mode. First, Muse Spark detects whether a text is a story, news or a read-aloud script, so readers never have to pick a setting. Then, for every paragraph it receives the passage plus the preceding text, infers how a skilled narrator would read it (speaker, emotion, contrastive stress, pauses, pitch, tempo, volume), and returns spans with a short reason that readers see in tooltips.

We wrap Muse Spark in a verifiable agent loop. The engine recomputes offsets from exact quotes, validates the schema and reading rules (stress density, one emotion per utterance, neutral news narration), and sends any errors back to Muse Spark to repair, up to two rounds.

We treat reasoning effort as a product setting: low for the live playground, at about 5 seconds per paragraph, and medium for the demo pages, where quality matters more than speed. Those demo pages are precomputed by running every text through the same Muse Spark engine, so they load instantly and cost nothing per visit.

The project was built with Claude Code and the Meta Model API working together. Claude Code, Anthropic's coding agent, was the development partner. It wrote and deployed the codebase while every prompt change was tested against live Muse Spark. Muse Spark powers everything readers see. Meta's Model API also exposes an Anthropic-format Messages endpoint (https://api.meta.ai) that Claude Code can use directly, with Muse Wonder for the main loop and Muse Spark for subagents, and our README documents that setup so contributors can keep building Mabarint end to end on Meta models.
```

### Why are Meta's models important to your solution?
```text
Annotating prosody is a reading-comprehension problem, not a keyword problem. To mark a passage correctly, Muse Spark has to work out who is speaking and to whom, notice that "Oh, wonderful" after a flat tyre is sarcasm rather than joy, see that a denial in the next line moves the stress to "she" or to "stole", and carry a scene's mood across paragraphs.

This needs strong long-context reasoning together with reliable structured output, which Muse Spark provides through JSON mode. The adjustable reasoning effort lets us trade depth for latency per use case. Because the format is open and the API is OpenAI-compatible, platforms can later move to Muse Spark Open weights and self-host for privacy and cost.
```

### Provide feedback from your experience using Meta products
```text
The OpenAI-compatible endpoint made the first call trivial: only the base URL and key changed. JSON mode worked together with reasoning_effort on Chat Completions.

The reasoning_effort setting is a big lever, and the docs could highlight its cost impact more. On the same passage, low took about 4.8 seconds with about 1.1k completion tokens (about 950 of them reasoning), while medium took about 9.5 seconds with about 2.2k completion tokens (about 2.0k reasoning). Reasoning tokens are billed as output.

Muse Spark copied quotes exactly and its character offsets were correct in our runs, although we still recompute offsets server-side as a safety net. Contrastive stress needed one explicit prompt rule. It went from 4 of 6 to 6 of 6 correct readings in our "one sentence" demo, which shows the model follows precise linguistic instructions well.

The quickstart leads with the Responses API. A short note that Chat Completions with response_format is fully supported would help people porting existing code.

Finally, supporting both OpenAI-compatible and Anthropic Messages formats is a strong choice. Our runtime uses the OpenAI SDK, while a coding agent like Claude Code can be pointed at the same API key with the copy-paste environment block in the coding agents guide.
```

### Provide feedback from your experience using partner technologies (Fireworks, Modal, Baseten)
```text
Not used in this submission; all inference goes through the Meta Model API. Running the engine on Muse Spark Open via Baseten or Modal is the planned next step.
```
