import Link from "next/link";
import { Annotated, IntensityProvider, IntensityToggle, Legend } from "@/components/reader";
import { DEMOS, MEANINGS, mainStress, spansOf } from "@/lib/demo";

export default function Home() {
  const demo = DEMOS.home;
  const preview = MEANINGS.variants.slice(0, 3);
  return (
    <IntensityProvider>
      <div className="wrap">
        <p className="eyebrow">A new reading format · powered by Meta Muse Spark</p>
        <h1>Authors write plain text.<br />Readers hear the voice.</h1>
        <p className="lead">
          Plain text loses tone. Mabarint reads the context of a passage with Muse Spark and adds subtle,
          tajwid-like notation for stress, pauses, pitch, tempo, volume and emotion, so readers know <em>how</em> a
          line should be read. Authors change nothing.
        </p>

        <div className="toolbar">
          <IntensityToggle />
          <span className="small muted">Toggle the notation. Hover a marked word to see why.</span>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="label">Plain text</div>
            <div className="reading" style={{ whiteSpace: "pre-wrap" }}>{demo.text}</div>
          </div>
          <div className="card">
            <div className="label">With Mabarint</div>
            <Annotated text={demo.text} spans={spansOf(demo)} />
          </div>
        </div>

        <section className="section">
          <h2>One sentence, many meanings</h2>
          <p className="muted">
            The same seven words. Muse Spark reads what came before and moves the stress.{" "}
            <Link href="/meanings">See all six readings →</Link>
          </p>
          <div className="grid-3">
            {preview.map((v) => {
              const stress = mainStress(v.annotation);
              return (
                <div className="card meaning" key={v.id}>
                  <Annotated className="sentence" text={MEANINGS.sentence} spans={v.annotation.spans} intensity="full" />
                  {stress?.reason && <div className="why"><strong>{stress.quote}</strong>: {stress.reason}</div>}
                </div>
              );
            })}
          </div>
        </section>

        <section className="section">
          <h2>How it works</h2>
          <div className="steps">
            <div className="card">
              <h3>Muse Spark reads the context</h3>
              <p className="muted small">Dialogue tags, punctuation, repetition, contrast, scene mood and who is speaking to whom. It returns structured spans with a short reason for each.</p>
            </div>
            <div className="card">
              <h3>The engine verifies every span</h3>
              <p className="muted small">Offsets are recomputed from exact quotes, schema and reading rules are checked, and errors go back to Muse Spark to repair (up to two rounds).</p>
            </div>
            <div className="card">
              <h3>The renderer adds notation</h3>
              <p className="muted small">An open JSON format becomes typography on any page: one script tag, the original words untouched.</p>
            </div>
          </div>
        </section>

        <section className="section">
          <h2>Notation guide</h2>
          <div className="card"><Legend /></div>
        </section>

        <section className="section">
          <h2>Add it to any page</h2>
          <pre>{`<script src="https://mazharrasyad.tech/mabarint/mabarint.js"></script>
<div data-mabarint data-mabarint-src="/mabarint/demo-data/home.json" data-mabarint-controls>
  ${demo.text.split("\n")[0].slice(0, 60)}…
</div>`}</pre>
          <p><Link href="/docs">Read the docs →</Link></p>
        </section>
      </div>
    </IntensityProvider>
  );
}
