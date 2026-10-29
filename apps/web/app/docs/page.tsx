import type { Metadata } from "next";

export const metadata: Metadata = { title: "Docs" };

const SPAN_ROWS = [
  ["utterance", "emotion, speaker, intensity 0–1, reason", "Soft coloured underline per emotion (sarcasm dashed)"],
  ["stress", "level 1 | 2 | 3, reason", "Heavier weight: 560 / 680 / 800"],
  ["elongate", "level 1 | 2 | 3", "Letter spacing 0.08 / 0.15 / 0.25em"],
  ["pause", "length short | long (start = end)", "Marker ‧ or ‖"],
  ["pitch", "contour rise | fall | rise-fall", "Last word shifts ±0.15em, glyph ↗ ↘"],
  ["tempo", "rate slow | normal | fast", "Word spacing +0.25em / -0.05em"],
  ["volume", "level whisper | soft | normal | loud | shout", "Opacity 0.55 / 0.75, size 1.08 / 1.15em"],
];

export default function DocsPage() {
  return (
    <div className="wrap narrow">
      <p className="eyebrow">Developers</p>
      <h1>Docs</h1>
      <p className="lead">
        Mabarint has three layers: the annotation engine (Muse Spark plus a validate-and-repair loop), an open
        offset-based JSON format, and a renderer that turns it into typography.
      </p>

      <section className="section">
        <h2>1. Drop-in script tag</h2>
        <p>Render precomputed annotations, or let the script call the engine for each element.</p>
        <pre>{`<script src="https://mazharrasyad.tech/mabarint/mabarint.js"
        data-endpoint="https://your-host/api/annotate"></script>

<!-- precomputed JSON -->
<div data-mabarint data-mabarint-src="/annotations/chapter-1.json" data-mabarint-controls>
  Plain text of the chapter…
</div>

<!-- annotate on load through the engine -->
<div data-mabarint="novel" data-mabarint-intensity="subtle">"No," she whispered.</div>`}</pre>
      </section>

      <section className="section">
        <h2>2. Renderer API</h2>
        <pre>{`import { render, setIntensity, unrender } from "@mabarint/renderer";

render(element, annotation, { intensity: "full" }); // "off" | "subtle" | "full"
setIntensity(element, "subtle");                    // cheap attribute switch
unrender(element);                                  // back to the original plain text`}</pre>
        <p className="small muted">
          Overlapping spans are flattened into runs that carry every covering class, so the DOM never needs crossing
          elements. The words are never changed; markers are <code>aria-hidden</code> and the AI&apos;s reasons are
          available as keyboard-focusable tooltips.
        </p>
      </section>

      <section className="section">
        <h2>3. Engine API</h2>
        <pre>{`POST /mabarint/api/annotate
Content-Type: application/json
Accept: application/json            (or text/event-stream for live progress)

{ "text": "…", "profile": "novel" | "news" | "script", "context": "optional preceding text", "code": "access code" }`}</pre>
        <p>Pipeline for every paragraph:</p>
        <ol>
          <li><strong>Segment</strong> into paragraphs, keeping the original character offsets.</li>
          <li><strong>Annotate</strong> with Muse Spark (<code>muse-spark-1.3</code>, JSON mode), passing the preceding paragraphs as context.</li>
          <li><strong>Validate</strong>: recompute offsets from each exact quote, check the schema, stress density (about 1 per 6 words), one emotion per utterance, and the news neutrality rule.</li>
          <li><strong>Repair</strong>: send the errors back to Muse Spark, up to two rounds; spans that still fail are dropped.</li>
          <li><strong>Cache</strong> by SHA-256 of text, profile, context, schema version, model and prompt.</li>
        </ol>
        <p className="small muted">The live demo requires an access code and is rate limited per IP and per day.</p>
      </section>

      <section className="section">
        <h2>4. Format (v0.1)</h2>
        <pre>{`{
  "version": "0.1", "profile": "novel", "lang": "en", "tone": "grief",
  "text": "\\"No,\\" she whispered. \\"He was fine this morning.\\"",
  "spans": [
    { "type": "utterance", "start": 0, "end": 5, "quote": "\\"No,\\"", "speaker": "Mara",
      "emotion": "sadness", "intensity": 0.8, "reason": "Denial at terrible news" },
    { "type": "volume", "start": 0, "end": 5, "quote": "\\"No,\\"", "level": "whisper" },
    { "type": "pause", "start": 20, "end": 20, "length": "short" },
    { "type": "stress", "start": 29, "end": 33, "quote": "fine", "level": 2, "reason": "Contrasts with now" }
  ]
}`}</pre>
        <div className="table-wrap">
          <table>
            <thead><tr><th>type</th><th>fields</th><th>notation</th></tr></thead>
            <tbody>
              {SPAN_ROWS.map(([t, f, n]) => <tr key={t}><td><code>{t}</code></td><td>{f}</td><td>{n}</td></tr>)}
            </tbody>
          </table>
        </div>
        <p>
          Emotions: <code>neutral joy sadness anger fear surprise tenderness sarcasm</code>. Offsets are UTF-16 indices,
          <code>[start, end)</code>, and <code>quote</code> always equals <code>text.slice(start, end)</code>. Full JSON
          Schema:{" "}
          <a href="https://github.com/mazharrasyad/mabarint/blob/main/schema/mabarint.schema.json">schema/mabarint.schema.json</a>.
        </p>
      </section>
    </div>
  );
}
