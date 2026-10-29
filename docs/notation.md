# Notation

| Span | Fields | Subtle | Full |
|---|---|---|---|
| stress | level 1/2/3 | weight 560 / 680 / 800 | same |
| pause | short / long | `‧` / `‖` | same |
| elongate | level 1/2/3 | none | letter-spacing 0.08 / 0.15 / 0.25em |
| pitch | rise / fall / rise-fall | none | last word ±0.15em, glyph ↗ ↘ ↗↘ |
| tempo | slow / fast | none | word-spacing +0.25em / -0.05em |
| volume | whisper / soft / loud / shout | none | opacity 0.55 / 0.75, size 1.08 / 1.15em |
| utterance | emotion, intensity | none | 2px underline (3px when intensity ≥ 0.75) |

Emotion colours (light / dark): joy `#d97706`/`#fbbf24`, sadness `#2563eb`/`#60a5fa`, anger `#dc2626`/`#f87171`, fear `#7c3aed`/`#a78bfa`, surprise `#0d9488`/`#2dd4bf`, tenderness `#db2777`/`#f472b6`, sarcasm grey **dashed**.

Accessibility:
- Colour is never the only signal: sarcasm is dashed, and the tooltips name the emotion.
- Glyphs are `aria-hidden`, so screen readers read the original words only.
- Annotated words that have a reason can be focused with the keyboard.
- Nothing is animated.
